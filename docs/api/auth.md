# 认证接口（Auth）

## 概述
- 鉴权模型：单用户密码登录，后端签发 JWT（HS256）。
- 有效期：默认 12 小时；在非生产环境可通过 `ttl`（秒）指定短期有效期，用于测试过期场景。
- 统一响应：所有接口经中间件统一包装为 `{ code, message, data }`。
- 公共/私有：`/auth/login` 为公共接口（无需登录）；`/auth/me` 需携带 `Authorization: Bearer <token>`。
- 统一失效：当配置中的 `password_updated_at` 大于令牌的签发时间 `iat` 时，该令牌判定为无效（用于“修改密码后所有会话失效”）。

## 基础配置
- API 基址：`http://localhost:8080`
- 内容类型：`application/json`
- 鉴权头：`Authorization: Bearer <token>`（访问私有接口时）

## 接口列表

### 1) 登录获取令牌
- 路径：`POST /auth/login`
- 方法：`POST`
- 鉴权：无需登录（noAuth: true）
- 描述：校验密码后签发 JWT；支持在非生产环境通过 `ttl` 指定短期有效期。

请求体
```json
{
  "password": "your-password",
  "ttl": 3
}
```
说明：
- `password` 必填，需与动态配置中的口令相匹配（当前使用 `core/dev/keyPassword`）。
- `ttl` 选填，仅在非生产环境生效（`app.env != "prod"`），范围 1~7200 秒；用于测试令牌过期。

响应
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": 1710000004
  }
}
```
字段说明：
- `data.token`：JWT 字符串（HS256）。
- `data.expiresAt`：过期时间戳（Unix 秒）。

示例（开发环境，测试 3 秒过期）
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123","ttl":3}' \
  http://localhost:8080/auth/login
```

前端联通
- Next.js BFF 代理：`front-web/src/app/api/auth/login/route.ts`
  - 代理将前端请求体中的 `password` 与 `ttl` 转发到后端 `/auth/login`。
- 登录页面：`front-web/src/app/login/page.tsx`
  - 登录成功后将令牌持久化（localStorage 与 Cookie），并跳转管理页。

### 2) 获取当前登录者信息
- 路径：`GET /auth/me`
- 方法：`GET`
- 鉴权：需要登录（需在请求头携带 Bearer Token）
- 描述：校验令牌（签名、过期、统一失效策略）后返回当前登录者信息。

请求（示例）
```bash
curl -X GET \
  -H "Authorization: Bearer <your-token>" \
  http://localhost:8080/auth/me
```

响应
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "user": {
      "username": "admin",
      "roles": ["admin"]
    }
  }
}
```

### 3) 登出当前会话
- 路径：`POST /auth/logout`
- 方法：`POST`
- 鉴权：需要登录（需在请求头携带 Bearer Token）
- 描述：校验当前令牌合法后返回成功；为无状态登出，客户端负责清除本地令牌。若未来需要强制失效，可扩展服务端黑名单或会话版本。

请求（示例）
```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  http://localhost:8080/auth/logout
```

响应
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "loggedOut": true
  }
}
```

前端联通
- BFF 路由：`front-web/src/app/api/auth/logout/route.ts`（转发 Authorization；统一返回 `{ loggedOut }`）
- 导航栏按钮：`front-web/src/components/layout/Navbar.tsx`（仅在已登录时显示"退出登录"；点击后调用 BFF、清除令牌并跳转至登录页）

### 4) 生成URL Token
- 路径：`POST /auth/generate-url-token`
- 方法：`POST`
- 鉴权：需要登录（需在请求头携带 Bearer Token）
- 描述：生成一个临时的URL访问token，用于构建无需登录的访问链接。Token有效期为1小时。

请求（示例）
```bash
curl -X POST \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  http://localhost:8080/auth/generate-url-token
```

响应
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": 1760548786
  }
}
```
字段说明：
- `data.token`：URL Token字符串（JWT格式，HS256）。
- `data.expiresAt`：过期时间戳（Unix 秒）。

前端联通
- BFF 路由：`front-web/src/app/api/auth/generate-url-token/route.ts`（转发 Authorization 到后端）
- 管理页面：`front-web/src/app/admin/url-token/page.tsx`（URL Token管理界面，支持生成、复制、打开登录链接）

## 令牌声明与失效策略
- 声明（Claims）：
  - `sub`：固定为当前单用户标识（`admin`）。
  - `iat`：签发时间（Unix 秒）。
  - `exp`：过期时间（Unix 秒）。
- 统一失效：
  - 动态配置 `auth/<env>/password_updated_at` 记录口令最后更新时间。
  - 当 `iat < password_updated_at` 时，后端在校验阶段返回未授权（令牌失效）。
- 密钥来源：
  - `auth/<env>/jwt_secret`（动态配置中读取），不得为空。

## 前端接口调用
前端统一使用 alova 库进行 API 调用，所有认证相关接口已封装在 `@/lib/auth-api.ts` 中：

```typescript
import { authApi } from '@/lib/auth-api'

// 登录
const loginResponse = await authApi.login({ password: 'your-password' })

// 获取用户信息
const userInfo = await authApi.me()

// 登出
await authApi.logout()

// 生成URL Token
const urlToken = await authApi.generateUrlToken({
  description: '用途描述',
  ttl: 3600,
  token_via: 'url'
})
```

### Alova 配置特性
- **自动认证**：请求拦截器自动添加 `Authorization: Bearer <token>` 头部
- **统一错误处理**：响应拦截器统一处理 401 错误和后端响应格式
- **类型安全**：所有接口都有完整的 TypeScript 类型定义
- **无需手动处理**：Token 获取、错误处理、响应解析都由 alova 自动完成

## 错误处理与稳定性
### 502错误修复（2025-10-16）
针对URL Token生成接口的间歇性502错误，前端API路由已实现以下优化：

1. **超时控制**：为fetch请求设置5秒超时，避免长时间等待
2. **重试机制**：最多重试2次，重试间隔递增（100ms, 200ms）
3. **错误处理**：详细记录失败原因，提供友好的错误信息

### 前端API路由特性
- **自动重试**：网络波动时自动重试，提升成功率
- **超时保护**：避免请求挂起影响用户体验
- **错误日志**：详细记录失败原因，便于问题排查

## 注意事项
1. 生产环境不支持通过 `ttl` 修改令牌有效期；请使用默认策略或在配置中调整全局有效期。
2. 前端本地持久化采用 localStorage 与 Cookie（带 `expires`），当 Cookie 未过期时可能作为后备；建议在后端严格按 `exp` 与失效策略判定授权。
3. 所有接口返回均使用统一响应中间件包装（`{ code, message, data }`），alova 拦截器已自动处理该格式。
4. **推荐使用 alova 接口**：前端应统一使用 `@/lib/auth-api.ts` 中的接口，避免直接使用 fetch 或其他 HTTP 客户端。
5. **网络稳定性**：前端API路由已实现超时和重试机制，可有效处理网络波动导致的临时失败。