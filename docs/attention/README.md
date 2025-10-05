注意事项与工程约定（持续维护）

目的
- 将项目在设计与实现过程中需要关注的注意事项集中维护，提升可维护性、可扩展性与性能表现。

通用设计注意事项
- 可维护性：
  - 模块与分层清晰，命名统一、注释完整，避免循环依赖。
  - 代码与文档同步更新，关键行为在 docs/execute 与 docs/api 中记录。
  - 保持单一职责，控制器薄、业务逻辑在 service 层、数据访问在 dao 层。
- 可扩展性：
  - 接口与类型设计面向抽象，减少对具体实现的强绑定。
  - 配置化能力优先，避免硬编码；面向接口编程，保留替换空间（如存储后端）。
- 性能：
  - 谨慎进行 IO/数据库访问；适当缓存热点数据；避免不必要的 JSON 编解码与日志写入。
  - 并发使用需关注锁粒度与数据竞争；及时释放资源与连接。

项目架构约定（GoFrame v2）
- 分层结构：api → controller → service → dao/model → resource。
- 控制器生成：
  - 使用 gf gen ctrl，API 定义文件遵循路径与命名约定：/api/<module>/v1/<definition>.go，结构体命名采用 OperationReq/OperationRes。
  - 响应不使用 g.Meta 的 mime 配置，中间件负责统一响应格式；控制器通过返回值输出数据，不直接 r.Response.WriteJson。
- 路由绑定：
  - 在 internal/cmd/cmd.go 中显式绑定控制器（例如 hello.NewV1()、visit.NewV1()）。
- 请求上下文与网络信息：
  - 使用 g.RequestFromCtx(ctx) 获取请求对象；优先使用 r.GetClientIp() 获取客户端 IP，必要时结合代理头部（X-Forwarded-For、X-Real-Ip 等）。
  - 认识到代理头部可能被伪造；在需要“真实远端”场景时参考 r.GetRemoteIp()。
- 错误处理与响应：
  - 使用 gerror/gcode 统一错误编码，由中间件统一包装响应。
- 日志与审计：
  - 访问记录当前落盘到 data/visit.log（JSON Lines 格式），后续可升级为数据库持久化（含索引与归档策略）。

数据库设计注意事项（规划）
- 表结构遵循规范：主键选择、必要索引、避免过宽行与过多 join。
- 审计字段：created_at、updated_at、operator、ip 等；归档与清理策略预先规划。
- 事务边界清晰，避免跨服务长事务；防止 SQL 注入并进行输入校验。

文档维护约定
- docs/api：记录接口定义与使用说明。
- docs/execute：记录实施过程与变更日志。
- docs/attention：记录工程注意事项与规范（本文件）。

实施检查清单（提交前自检）
- API：
  - 请求/响应结构与命名符合 gf gen ctrl 约定；路由、方法与 summary 完整。
  - 响应由中间件统一包装，控制器返回值为数据对象（不直接写响应）。
- Controller：
  - 仅负责参数绑定与调用 service；错误使用 gerror/gcode 封装。
- Service：
  - 业务逻辑可测试、幂等；不依赖具体传输层实现。
- DAO：
  - 索引与事务设计合理；查询性能可接受；注意注入与异常处理。
- 性能与安全：
  - 日志量与频度控制；并发安全；CORS、输入校验与头部可信来源评估。

示例参考（Visit 接口）
- 响应结构：返回扁平数据（time、ip、userAgent、method、path、headers），不包含 status 字段。
- 统一响应：由中间件处理，无需在 Res 中配置 mime。
- IP 获取：优先 r.GetClientIp()，必要时结合代理头；谨慎信任头部，识别伪造风险。
- 数据持久化：当前写入 data/visit.log，后续可迁移至数据库并添加索引与归档。

维护说明
- 当新增模块或规范变更时，请同步更新本文件，并在 docs/execute 中记录具体实施步骤与变更原因。