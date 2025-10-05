# 访问记录接口（Visit）

用途：当用户访问主界面时，记录一条访问日志，包含时间、IP、请求头、User-Agent、请求方法与路径。

接口信息：
- 路径：`POST /logs/visit`
- Tags：`Visit`
- 摘要：Record a visit of home page

请求：
- Body：无（由服务端从请求上下文自动获取）

响应：
```json
{
  "status": "ok",
  "data": {
    "time": "2025-10-05T12:34:56.789Z",
    "ip": "127.0.0.1",
    "userAgent": "Mozilla/5.0 ...",
    "method": "POST",
    "path": "/logs/visit",
    "headers": {
      "User-Agent": "Mozilla/5.0 ...",
      "Accept": "*/*"
    }
  }
}
```

持久化：
- 优先写入 PostgreSQL 表 `logs_visit_access`；数据库不可用时降级将 JSON 行写入 `server/data/visit.log`

相关代码位置：
- API 定义：`server/api/visit/v1/visit.go`
- 控制器：`server/internal/controller/visit/visit_v1_create.go`
- 服务层：`server/internal/service/visit.go`
- 路由绑定：`server/internal/cmd/cmd.go`（在路由组中绑定 `visit.NewV1()`）

注意事项：
- IP 获取使用框架提供的远端 IP 方法，避免被 Header 伪造；当无法获取时字段为空。
- Headers 为扁平化后的首个值映射，若需完整保留可改为数组或 JSON 原样存储。
- 如部署在反向代理后，务必在网关层规范并清洗相关真实 IP 头（如 X-Forwarded-For）。