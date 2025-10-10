动态配置 API

### GET /config/stats

- 描述：获取当前进程内缓存的条目数统计。
- 方法：GET
- 路径：`/config/stats`
- 鉴权：当前阶段未接入（后续建议仅管理员可见）。

请求
- 无请求体。

响应
- 200 OK
  - entries：int，当前缓存中条目总数。

示例
```bash
curl -s "http://localhost:8000/config/stats"
# 返回示例
{
  "entries": 123
}
```

说明
- 该数值由服务端的进程内缓存统计（configcache.Stats），用于前端展示或观测。
- 结合 POST /config/refresh 使用，可在刷新后观察条目数变化与生效情况。

概述
- 提供动态配置的查询、修改、版本管理、批量导入/导出以及缓存刷新接口。
- 后端采用 GoFrame（gf）实现，数据库为 PostgreSQL；配置在进程内做线程安全缓存并在关键时点重建。
- 目前暂不启用鉴权（按项目当前阶段要求），后续可在控制器中加入鉴权与审计。

缓存说明
- 启动预热：服务启动时调用 PreloadAll 将 enabled=true 的配置加载到内存。
- 自动重建：在 Create/Update/Delete/Rollback/Import 成功提交后触发 Rebuild 原子替换缓存。
- 外部刷新：POST /config/refresh 手动重建缓存，返回条目数与耗时。

API 列表
1) GET /config/list
   - 描述：分页查询当前配置（来自 dynamic_configs）。
   - 查询参数：namespace、env、key_like、enabled、page（默认1）、size（默认20，最大200）。
   - 响应：{ items: ConfigItem[], total: number }

2) GET /config/item
   - 描述：按唯一键（namespace+env+key）查询单条配置。
   - 查询参数：namespace（必填）、env（必填）、key（必填）。
   - 响应：{ item: ConfigItem|null }

3) POST /config/create
   - 描述：创建配置，version 初始为 1，同时写入版本表。
   - 请求体：{ namespace, env, key, type, value, enabled, description, change_reason }
   - 响应：{ ok: boolean }
   - 可能错误：已存在（409-like）、参数校验失败（400-like）。

4) PUT /config/update
   - 描述：更新配置，乐观锁校验 version，成功后 version+1 并写版本表。
   - 请求体：{ namespace, env, key, type, value, enabled, description, version, change_reason }
   - 响应：{ ok: boolean }
   - 可能错误：config not found、version conflict。

5) DELETE /config/delete
   - 描述：软删除（enabled=false），乐观锁校验 version，成功后 version+1 并写版本表。
   - 请求体：{ namespace, env, key, version, change_reason }
   - 响应：{ ok: boolean }

6) GET /config/versions
   - 描述：查询某配置的版本列表（来自 dynamic_config_versions）。
   - 查询参数：namespace（必填）、env（必填）、key（必填）、page、size。
   - 响应：{ items: VersionItem[], total: number }

7) POST /config/rollback
   - 描述：将指定 ToVersion 的内容作为新版本应用到当前表，并记录新版本。
   - 请求体：{ namespace, env, key, to_version, change_reason }
   - 响应：{ ok: boolean }
   - 可能错误：target version not found、config not found。

8) POST /config/import
   - 描述：批量导入；不存在则新增并版本=1，存在则 version+1 更新并记录版本。
   - 请求体：{ items: ConfigItem[], change_reason }
   - 响应：{ ok: boolean, added: number, updated: number }
   - 限制：items 长度建议 1~10000。

9) GET /config/export
   - 描述：导出当前配置列表（可按 namespace/env/enabled 过滤）。
   - 查询参数：namespace、env、enabled。
   - 响应：{ items: ConfigItem[] }

10) POST /config/refresh
   - 描述：手动重建内存缓存，返回重建状态、条目数与耗时（毫秒）。
   - 请求体：{ reason? }
   - 响应：{ status: "ok"|"failed", entries: number, elapsed_ms: number }

数据结构
- ConfigItem：
  {
    namespace: string,
    env: string,
    key: string,
    type: "string"|"json"|"number"|"bool",
    value: any(JSON),
    enabled: boolean,
    version: number,
    description?: string,
    updated_by?: string,
    updated_at?: string
  }
- VersionItem：
  {
    version: number,
    value: any(JSON),
    changed_by?: string,
    change_reason?: string,
    created_at?: string
  }

示例
- 创建配置
  POST /config/create
  {
    "namespace": "core",
    "env": "prod",
    "key": "FeatureX",
    "type": "bool",
    "value": true,
    "enabled": true,
    "description": "启用核心特性X",
    "change_reason": "上线开启"
  }
  响应：{ "ok": true }

- 更新配置
  PUT /config/update
  {
    "namespace": "core",
    "env": "prod",
    "key": "FeatureX",
    "type": "bool",
    "value": false,
    "enabled": true,
    "description": "临时关闭X",
    "version": 1,
    "change_reason": "紧急回滚"
  }
  响应：{ "ok": true }

- 刷新缓存
  POST /config/refresh
  { "reason": "手动同步" }
  响应：{ "status": "ok", "entries": 128, "elapsed_ms": 23 }

注意
- 当前阶段不做鉴权；后续应限制写入类接口只允许管理员。
- value 存储为 JSONB，接口层支持字符串、数值、布尔、对象、数组等 JSON 值。
- size 最大 200 以避免过大分页造成压力。

前端管理集成
- 管理页面路径：`/admin/config/manage`（Next.js 前端）。
- 功能概览：列表查询、筛选、分页；编辑（类型：string/json/number/bool）、删除/禁用、版本历史与回滚、导入/导出；“刷新缓存”按钮与缓存条目数展示。
- 典型操作流程：
  1) 查询当前配置：调用 `GET /config/list` 或检索单项 `GET /config/item`。
  2) 修改配置：调用 `PUT /config/update`（携带最新 `version` 与 `change_reason`）。成功后版本自动 +1，并触发服务端缓存重建。
  3) 删除/禁用：调用 `DELETE /config/delete`（同样做乐观锁校验）。
  4) 回滚历史：调用 `POST /config/rollback` 将指定版本内容作为新版本应用。
  5) 刷新缓存：可在写入类操作成功后由服务端自动触发，也可在前端点击“刷新缓存”按钮，调用 `POST /config/refresh` 手动重建缓存。
  6) 观测缓存状态：调用 `GET /config/stats` 查看条目数变化与生效情况；前端页面会展示最新条目数。

备注
- 前端管理页通过 Next.js API 路由或直接代理到后端 `SERVER_URL`（默认 `http://localhost:8080`）。
- 生产环境建议为写入类接口接入鉴权与审计（who/when/what/why），并限制“刷新缓存”操作仅管理员可用。