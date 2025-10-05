# 依赖管理

本文档记录项目依赖的来源、版本与管理策略，覆盖前端（Next.js + Arco Design）、后端（GoFrame）、数据库（PostgreSQL 18）及工具链。请严格遵循本仓库的注释与规范要求，保证依赖安全可控、可更新、可回滚。

## 总览

- 前端工程：front-web
  - 框架与运行时：Next.js 15.5.4、React 19.1.0、React DOM 19.1.0
  - 组件库：@arco-design/web-react ^2.66.5（配套全局样式）
  - 语言与构建：TypeScript ^5、ESLint ^9、Tailwind CSS ^4（模板默认引入）
  - 请求管理：alova v3（通过子路径导入：`alova/react`、`alova/fetch`、`alova/client`）
- 后端工程：server
  - 框架：GoFrame v2（当前 go.mod 记录为 v2.7.1，CLI 运行为 v2.9.x）
  - 语言与工具：Go 1.24.4（本机环境），gf CLI v2（用于脚手架与 dev-run）
  - 数据库驱动：pgsql（建议显式引入 github.com/gogf/gf/contrib/drivers/pgsql/v2）
- 数据库：PostgreSQL 18
  - 本地/测试连接：见 docs/db/db.md 中的环境变量与连接示例

## 前端依赖

依赖声明来自 front-web/package.json：

```json
{
  "dependencies": {
    "@arco-design/web-react": "^2.66.5",
    "next": "15.5.4",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "15.5.4",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

说明与约定：
- 全局样式：`@arco-design/web-react/dist/css/arco.css` 已在 `src/app/layout.tsx` 中引入。
- ConfigProvider：通过客户端组件 `src/components/ClientProvider.tsx` 注入，避免 Server Component 上下文错误。
- 包管理器：使用 npm；保留 `package-lock.json` 以锁定依赖版本，避免不可预期的升级。
- Node 版本：建议使用 Node 18+ 或 20+（与 Next.js 官方兼容矩阵保持一致）。
 - 请求库：alova v3 仅需安装主包 `alova`，按需从子路径引入：
   - 配置示例：`src/lib/alova.ts` 使用 `alova/react` 作为 statesHook、`alova/fetch` 作为请求适配器；`baseURL` 读取 `NEXT_PUBLIC_API_BASE`。
   - Hook 使用：从 `alova/client` 引入 `useRequest`/`useFetcher`，仅在客户端组件中调用。

常用命令：
- 开发：`npm run dev`
- 构建：`npm run build`
- 启动：`npm start`
- 代码检查：`npm run lint`

## 后端依赖

依赖声明来自 server/go.mod：

```go
module server

go 1.18

require github.com/gogf/gf/v2 v2.7.1
```

说明与约定：
- CLI 版本与库版本差异：当前通过 gf CLI v2.9.x 开发，go.mod 记录 v2.7.1。后续建议统一到 v2.9.x，确保特性一致（通过 `go get github.com/gogf/gf/v2@v2.9.3` 或更新脚手架生成的版本）。
- 数据库驱动：采用 PostgreSQL 时，建议在 go.mod 中显式加入：

```go
require github.com/gogf/gf/contrib/drivers/pgsql/v2 v2.9.3 // or latest
```

- 运行与开发：使用 gf CLI 进行构建与热启动：
  - `& "C:\\Users\\<用户名>\\go\\bin\\gf.exe" run main.go`
  - 默认端口在 `server/manifest/config/config.yaml` 中配置，已调整为 `:8080`。

## 数据库依赖

- 版本：PostgreSQL 18
- 连接：在 `server/manifest/config/config.yaml` 中配置 `database.default.link`，格式：

```yaml
database:
  default:
    link: "pgsql:<user>:<pass>@tcp(<host>:<port>)/<database>"
```

- 本地环境变量示例：参考 `docs/db/db.md`。
- 迁移与种子：规划在 `db/migrations` 与 `db/seeds`（详见 docs/db/db.md）。

## 版本与更新策略（SemVer）

- 固定核心版本：
  - Next.js 与 eslint-config-next 同步固定（例如 15.5.4）。
  - React/React DOM 固定主次版本以减少破坏性变更（当前 19.1.0）。
  - GoFrame 统一到 v2.9.x，避免 CLI 与库版本不一致导致的差异行为。
- caret(^) 与固定版本：
  - 前端对 UI 库与构建工具使用 `^` 可允许小版本更新，但重要基座（next、react）建议固定版本并通过定期升级验证。
  - 后端 go.mod 对核心框架与数据库驱动建议指定明确版本号，升级前在测试环境验证。
- 锁定文件：必须提交 `package-lock.json` 与 `go.sum`，确保可复现构建。

## 安全与合规

- 依赖审查：定期运行 `npm audit` 与 `go list -m -u all` 检查安全与可更新项。
- 第三方许可：前端与后端依赖遵循各自开源许可，注意与仓库 LICENSE 兼容。
- 供应链风险：避免引入来源不明的包；尽量选择主流、高信任度的依赖。

## 变更流程（建议）

1) 在分支上升级或新增依赖，更新锁定文件。
2) 本地与 CI 跑通 lint/test/build，验证前后端服务启动与页面渲染。
3) 更新相关文档（本页与 CHANGELOG/README），说明变更原因与影响范围。
4) 代码评审通过后合并主分支，并在测试环境进行联调回归。

## 常见问题

- gf CLI 未识别：将 GOPATH/bin 加入 PATH，或使用绝对路径执行。
- Next.js 报错 “createContext only works in Client Components”：确保在客户端组件中使用上下文（已通过 `ClientProvider` 修复）。
- 端口占用：调整 `server.address`（例如改为 `:8080`），或关闭冲突进程。

以上依赖与策略会随项目演进及时更新，请在引入或升级依赖时同步维护本文档。