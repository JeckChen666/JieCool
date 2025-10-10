# 动态配置（KV）与缓存体系实施计划（2025-10-09）

附注（端口与前端代理配置）
- 前端端口：3000；后端端口：8080。
- 前端 Next.js API 路由已通过 /api/config/* 代理到后端，默认后端地址为 http://localhost:8080。
- 可通过环境变量覆盖：SERVER_URL 或 NEXT_PUBLIC_SERVER_URL（示例：NEXT_PUBLIC_SERVER_URL=http://localhost:8080）。
- 管理页面入口：/admin/config，包含“刷新缓存”与缓存条目数展示。

本文档描述在服务端引入“动态配置（KV）”及其缓存体系的完整行动计划，覆盖启动预加载、变更触发重建与外部刷新接口，以满足“程序启动即加载全部配置、修改后销毁并重建缓存、提供外部刷新接口”的要求。

## 目标与范围

- 提供以 key/namespace/env 组织的动态配置存储，支持 JSON/基本类型值。
- 在程序启动阶段，读取所有配置并写入内存缓存，供内部快速查询。
- 当配置发生变更（新增/更新/删除/回滚/导入），销毁当前缓存并重建，确保强一致性。
- 暴露一个外部管理接口（API）以触发缓存重建（Refresh）。
- 保持不依赖外部缓存服务（如 Redis），仅使用数据库 + 进程内内存缓存。

## 架构概览

- 持久层：数据库两张表
  - dynamic_configs（当前生效配置）
  - dynamic_config_versions（历史版本与审计）
- 服务层：ConfigCache（进程内）
  - 数据结构：map[namespace][env]map[key]ConfigItem
  - 线程安全：sync.RWMutex 或 sync.Map
  - 能力：PreloadAll、Rebuild、Get、Invalidate
- 管理 API：/api/configs/*（CRUD/历史/导入导出）与 /api/configs/refresh（重建缓存）
- 事件与钩子：写操作成功后触发 Rebuild（或按需部分失效，但本版按“销毁并重建”执行）

## 阶段性行动计划

### 阶段 1：数据库设计与迁移
1. dynamic_configs 表
   - 字段：id、namespace、env、key、type、value（json/text）、enabled（bool）、version（int）、description、created_by、updated_by、created_at、updated_at、deleted_at
   - 索引：唯一 (namespace, env, key)，查询 (namespace, env, enabled)
2. dynamic_config_versions 表
   - 字段：id、config_id、version、value、changed_by、change_reason、created_at
3. 编写迁移脚本与回滚脚本；初始化命名空间/环境（如 default/dev/staging/prod）。

### 阶段 2：服务层与缓存实现（ConfigCache）
1. 包结构：`internal/service/configcache`
2. API：
   - `PreloadAll(ctx context.Context) error`：从 DB 读取全部 enabled 配置，构建内存结构；启动时调用。
   - `Rebuild(ctx context.Context) error`：清空内存缓存（销毁），再调用 PreloadAll 重建。
   - `Get(ctx, ns, env, key, opts...)`：内部查询接口，支持默认值与类型转换。
   - `Invalidate()`：清空当前缓存，供写操作完成后使用（本版直接 Rebuild 全量）。
3. 并发安全：使用 RWMutex；Rebuild 期间阻塞读以确保一致；必要时提供“读旧值”的开关（本版默认强一致阻塞）。
4. 降级策略：若 Rebuild 失败，记录错误并保留旧缓存；可配置最大重试次数与退避策略。
5. 指标与日志：缓存条目数、重建耗时、失败率、命中率（后续扩展）。

### 阶段 3：管理 API 与刷新接口（路径重新设计）
参考现有 API 风格（如 `/daily/sentence`、`/file/stats`、`/logs/visit`），采用动词化或功能化子路径，避免资源 ID 暴露，便于基于 namespace/env/key 的查询与操作。

1. 查询与检索（Config, GET）
   - GET `/config/list`：分页与筛选（参数：namespace、env、key（模糊）、enabled、page、size）
   - GET `/config/item`：按唯一键检索（参数：namespace、env、key）
   - GET `/config/versions`：查询历史版本（参数：namespace、env、key、page、size）

2. 变更与管理（Config, POST/PUT/DELETE）
   - POST `/config/create`：创建配置（body：namespace、env、key、type、value、enabled、description、change_reason）
   - PUT  `/config/update`：更新配置（body：namespace、env、key、type、value、enabled、description、version、change_reason）
   - DELETE `/config/delete`：删除配置（body：namespace、env、key、version、change_reason）
   - POST `/config/rollback`：回滚（body：namespace、env、key、to_version、change_reason）
   - POST `/config/import`：批量导入（文件或 JSON 数组，含 change_reason）
   - GET  `/config/export`：导出（参数：namespace、env、enabled）

3. 刷新接口（外部触发，Config, POST）
   - POST `/config/refresh`：触发内存缓存重建（body：reason，可选）
   - 鉴权：管理员角色；审计字段 `triggered_by` 与 `reason`
   - 行为：调用 `configcache.Rebuild(ctx)`；返回重建统计（entries、elapsed_ms、status）

4. 变更钩子与一致性
   - CRUD/回滚/导入成功提交后，调用 `configcache.Rebuild(ctx)`（或发事件，由监听器执行）
   - 多实例部署预留：webhook/消息通道触发各实例重建；本版聚焦单实例。

### 阶段 4：前端管理界面（Next.js）
1. 列表：筛选（namespace/env/enabled）、搜索 key、分页展示。
2. 编辑：JSON 编辑器 + Schema 校验；变更理由必填；支持类型选择与默认值提示。
3. 历史与回滚：版本列表、JSON diff；支持一键回滚。
4. 导入/导出：上传/下载 JSON 或 YAML；失败行提示。
5. 刷新按钮：调用 `/api/configs/refresh`，展示重建结果（耗时、条目数）。

### 阶段 5：测试与可观测性（使用 chrome-devtools-mcp）
测试不再硬编码大量脚本，统一通过 chrome-devtools-mcp 工具进行交互式验证与录制：

1. 启动与预加载验证
   - 打开管理界面首页（Next.js 管理页）。
   - 通过页面快照与列表数据，确认启动后已 PreloadAll（列表加载无延迟，命中缓存）。

2. CRUD 与版本历史
   - 使用表单创建/编辑/删除配置，提交后观察列表与历史视图变化。
   - 通过网络请求列表捕获（devtools 网络面板）确认调用 `/config/create`、`/config/update`、`/config/delete`、`/config/versions`。
   - 验证变更成功后是否触发 `Rebuild`（可在日志区域或指标面板查看）。

3. 回滚与导入/导出
   - 执行回滚操作（`/config/rollback`），查看版本差异与当前生效值变化。
   - 测试导入与导出接口，确认格式与错误提示。

4. 刷新接口与缓存重建
   - 点击“刷新缓存”按钮或直接调用 `/config/refresh`，验证重建统计返回与页面刷新后的数据一致性。

5. 并发与乐观锁（轻量）
   - 在两个页面会话中编辑同一配置，提交一个旧 version，确认前端冲突提示与后端拒绝（HTTP 409 或业务码）。

6. 指标与日志
   - 在页面中或通过日志查看重建耗时分布、失败率、缓存规模；审计记录（who/when/what/why）。

### 阶段 6：上线与运维
1. 启动流程：
   - 应用启动 → DAO 初始化 → `configcache.PreloadAll(ctx)` → 日志输出条目数与耗时。
2. 备份与回滚：迁移前备份数据；导入/回滚操作有审计记录；刷新接口可随时重建。
3. 灰度与压测：在测试环境验证重建耗时、读写并发影响与失败降级。

## 关键实现细节建议

- 乐观锁与版本：在 dynamic_configs 上维护 `version`，前端提交包含版本以避免并发覆盖。
- JSON Schema：可选，为关键 key 提供 Schema 校验；服务层在落库与缓存重建时校验。
- 键查找策略：严格匹配 (namespace, env, key)；支持回退到 default env（可配置）。
- 多实例拓展：本版单实例；多实例需联动：
  - 刷新接口发出后，向其他实例推送（webhook 或消息队列）；各实例执行 Rebuild。
  - 或改为局部失效 + 定时一致性校验，以降低集群重建开销。

## 里程碑与交付物

- 数据库迁移脚本与初始化数据。
- 服务层 `configcache` 包（PreloadAll/Rebuild/Get/Invalidate）。
- 管理 API（CRUD/历史/回滚/导入导出）与 `/api/configs/refresh`。
- 前端管理界面（列表/编辑/历史/回滚/导入导出/刷新）。
- 测试用例与可观测指标；运维文档与上线清单。

实施状态更新（2025-10-10）
- 管理页面已就绪：`/admin/config/manage`；包含“刷新缓存”按钮与缓存条目数展示（对接 `POST /config/refresh` 与 `GET /config/stats`）。
- CRUD 与版本联动：在前端页面完成 Number/JSON/String/Bool 的编辑、删除/禁用等操作后，版本与描述、启用状态与更新时间均能在列表中正确反映；服务端在写入类操作成功后自动触发缓存重建。
- 交互验证结论：刷新按钮可手动重建缓存并配合条目数观测；列表刷新显示与接口返回一致，说明前后端与缓存联动正常。
- 参考文档：`docs/api/config.md`（接口契约与示例）、`docs/execute/2025-10-09-dynamic-config-implementation.md`（落地与验证记录）。

## 风险与缓解

- 重建耗时较长：按 namespace/env 分批加载；并发分页拉取；必要时切换为局部失效。
- 重建期间读阻塞：可选读旧值模式（双缓存结构）；本版默认强一致阻塞，简化实现。
- 多实例一致性：单实例先行；后续接入 webhook/消息通道与健康检查。

---

如需我立即开始实现服务层 `configcache` 包与刷新接口，请确认数据库类型（PostgreSQL/MySQL）与是否为单实例部署；我将基于现有 GoFrame 项目结构给出具体代码草案。