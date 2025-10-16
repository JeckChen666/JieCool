# BFF 代理说明（Front Web / Next.js）

目标
- 降低前端与后端的耦合，通过 BFF（Backend For Frontend）在前端项目内统一请求、鉴权与响应格式。
- 避免跨域复杂性：同源下由 Next.js 路由处理转发，客户端仅与 BFF 交互。
- 统一错误与消息展示规范，减少 UI 组件对后端差异的感知。

运行时与路径规范
- 技术栈：Next.js App Router（`src/app/api/**/route.ts`）。
- 每个 BFF 端点对应一个 `route.ts`，使用 `export async function GET/POST` 实现方法。
- 现有示例：
  - 认证登录：`front-web/src/app/api/auth/login/route.ts` → 后端 `POST /auth/login`
  - 动态配置：`front-web/src/app/api/config/create/route.ts`、`front-web/src/app/api/config/rollback/route.ts` → 映射后端配置接口（详见 `docs/api/config.md`）

后端响应约定与前端标准化
- 后端统一响应包装：`{ code, message, data }`（由 `ghttp.MiddlewareHandlerResponse` 统一输出）。
- BFF 标准化策略：
  - 保持 `{ code, message, data }` 结构向客户端返回，避免二次语义转换带来的混淆。
  - 如需简化给 UI 的状态判断，可在 BFF 增补 `ok = (code === 0)` 字段（推荐仅在内部使用）。

鉴权与令牌传递
- 公共接口（`noAuth: true`）：`/daily/sentence`、`/logs/visit` 等可直接由客户端调用或经 BFF 转发，均允许未登录访问。
- 受保护接口：需要 `Authorization: Bearer <token>` 传递。
- 当前实现（阶段A）：
  - 登录后客户端保存令牌（localStorage + 非 HttpOnly Cookie），随后客户端请求时自行在请求头附加 `Authorization`。
  - BFF 接收到请求时，透传客户端 Header（包含 Authorization）到后端。
- 推荐增强（阶段B）：
  - 登录成功后由 BFF 设置 HttpOnly Cookie（如 `auth_token`），客户端不再直接持有令牌，降低 XSS 风险。
  - BFF 在转发时自动从 HttpOnly Cookie 注入 `Authorization`。
  - 如采用 HttpOnly，需要加入 CSRF 防护（如双重提交 Cookie 或自定义 Header 校验）。

环境变量与后端地址
- 建议通过环境变量配置后端基地址，例如：
  - `process.env.BACKEND_BASE_URL`（示例：`http://localhost:8080`）。
  - 如需区分环境，可使用 `process.env.NEXT_PUBLIC_APP_ENV`（`dev`/`test`/`prod`），以决定是否转发调试参数（如 `ttl`）。

接口映射与示例
1) 认证登录（POST /api/auth/login → 后端 /auth/login）
   - 入参：`{ password, ttl? }`；`ttl` 仅在非生产环境有效，用于测试令牌过期。
   - 响应：后端返回 `{ code, message, data: { token, expiresAt } }`。
   - BFF 处理：
     - 读取请求体，构造后端请求。
     - 非生产环境转发 `ttl`；生产环境忽略。
     - 返回统一结构给客户端。
   - 示例（简化版）：
     ```ts
     import { NextRequest, NextResponse } from 'next/server'

     export async function POST(req: NextRequest) {
       const body = await req.json()
       const { password, ttl } = body || {}
       const base = process.env.BACKEND_BASE_URL || 'http://localhost:8080'

       const payload: any = { password }
       const env = process.env.NEXT_PUBLIC_APP_ENV
       if (env && env !== 'prod' && ttl) payload.ttl = ttl

       const res = await fetch(`${base}/auth/login`, {
         method: 'POST',
         headers: { 'content-type': 'application/json' },
         body: JSON.stringify(payload),
       })
       const json = await res.json()

       // 若需要由 BFF 设置 Cookie（阶段B方案）：
       // if (json?.code === 0 && json?.data?.token) {
       //   const resp = NextResponse.json(json)
       //   resp.cookies.set('auth_token', json.data.token, {
       //     httpOnly: true,
       //     sameSite: 'lax',
       //     expires: new Date((json.data.expiresAt || 0) * 1000),
       //   })
       //   return resp
       // }

       return NextResponse.json(json)
     }
     ```

2) 动态配置（POST /api/config/create、POST /api/config/rollback）
   - 入参与后端字段参考 `docs/api/config.md`。
   - 响应：后端 `{ code, message, data }`，BFF 可直接返回。
   - 若需要给 UI 简化，可在 BFF 增补 `{ ok: code === 0 }`。

Header 与错误处理
- Header 透传：`Authorization`、`content-type`、自定义业务头等。
- 错误处理：
  - 后端业务错误（`code != 0`）：BFF 返回 200 + `{ code, message, data }`，由前端据 `code` 渲染错误提示（推荐）。
  - 协议错误（网络失败、5xx、超时）：BFF 捕获并返回 `{ code: 500, message: 'Internal Error', data: null }` 或透传 5xx，前端统一兜底。
- 统一消息：
  - 成功消息以 "OK" 为主，错误匹配后端 `message` 原文，避免二次翻译误差。

与直接后端调用的取舍
- 直接调用后端：公共接口（`noAuth: true`）在 CORS 正确配置时可直接访问，减少一跳。
- 经 BFF 调用：
  - 统一响应与错误；
  - 屏蔽后端变更；
  - 可注入鉴权与风控（如限流、黑名单）。
  - 推荐对受保护接口与复杂 UI 逻辑使用 BFF。

缓存与性能
- 默认为动态响应（避免静态缓存导致鉴权错误）。如需缓存，可在 BFF 对公共接口添加短期缓存（`revalidate` 或手动缓存），但需与业务一致性权衡。

安全实践
- 避免在日志中记录明文密码与完整令牌。
- 生产环境禁用 `ttl` 转发（由后端忽略，BFF也避免主动传递）。
- 推荐升级为 HttpOnly Cookie 携带令牌，并引入 CSRF 防护。

测试与联调
- E2E 用例建议覆盖：
  - 受保护页面未登录重定向；
  - 通过 BFF 登录成功，返回 token；
  - 携带令牌访问受保护接口；
  - 非生产 `ttl` 过期后重定向到登录；
  - 公共接口可访问（/daily/sentence、/logs/visit）。

后续扩展建议
- 抽象 `createBffProxy()` 工具：封装方法、Header、错误处理与响应规范，减少重复代码。
- 在 BFF 层增加速率限制与审计日志（仅记录必要字段）。
- 根据角色与权限扩展不同端点的鉴权注入策略。

参考文件
- 前端：
  - `front-web/src/app/api/auth/login/route.ts`
  - `front-web/src/app/api/config/create/route.ts`
  - `front-web/src/app/api/config/rollback/route.ts`
- 文档：
  - `docs/api/auth.md`
  - `docs/api/config.md`
  - `docs/project.md`