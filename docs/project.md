项目目录结构设计（Next.js + Arco Design + GoFrame + PostgreSQL 18）

一、项目概述

本项目为个人网站，前端采用 Next.js（SSR/SSG/App Router），配合 Arco Design 组件库及其主题定制与国际化；后端采用 GoFrame 框架，提供 RESTful API 与服务治理；数据库采用 PostgreSQL 18，配合规范化的迁移与初始化脚本；同时提供部署与运维支撑的目录结构与文档。

二、技术栈与约定

- 前端：Next.js 14+（App Router，默认支持 SSR/SSG）、TypeScript、Arco Design
- 后端：GoFrame v2、分层架构（controller/service/dao/model/router/middleware）
- 数据库：PostgreSQL 18，使用 SQL 迁移文件管理版本
- 接口契约：OpenAPI（YAML/JSON），前后端共享类型定义
- 部署：Docker Compose（本地与开发）、Kubernetes（生产可选），环境分层 dev/test/prod
- 代码规范：遵循仓库 .trae/rules 要求，代码必须有详细注释；统一使用 ESLint/Prettier（前端）与 golangci-lint（后端）

三、根目录结构

```
├── docs/                       # 项目文档（设计、接口、数据库等）
│   ├── api/
│   ├── db/
│   ├── depend/
│   ├── describe/
│   ├── execute/
│   ├── front-web/
│   ├── server/
│   └── project.md              # 本文件：项目结构设计
├── front-web/                  # 前端工程（Next.js + Arco Design）
├── server/                     # 后端工程（GoFrame）
├── db/                         # 数据库迁移与初始化脚本
├── deploy/                     # 部署与运维（Docker/K8s/Helm 可选）
├── .trae/                      # 项目规则与自动化辅助
├── .editorconfig               # 编辑器统一配置
├── .gitignore                  # Git 忽略规则
├── README.md                   # 项目综述与快速开始
└── LICENSE                     # 许可证（可选）
```

四、前端目录结构（front-web/）

采用 Next.js App Router 模式，默认 SSR，按页面与功能模块划分；集成 Arco Design 主题与国际化。

```
front-web/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── .eslintrc.js
├── .prettierrc.json
├── .env.local.example          # 前端环境变量样例（不提交真实密钥）
├── public/
│   ├── favicon.ico
│   └── assets/                 # 静态资源（图片、字体等）
├── app/                        # App Router（SSR/SSG，推荐）
│   ├── layout.tsx              # 根布局：引入 ArcoProvider、主题、国际化等
│   ├── page.tsx                # 主页（个人信息摘要）
│   ├── about/
│   │   └── page.tsx            # 关于我（详细个人信息）
│   ├── contact/
│   │   └── page.tsx            # 联系方式
│   ├── profile/
│   │   └── page.tsx            # 个人简历/项目经历（可从后端拉取）
│   ├── components/
│   │   ├── common/             # 通用组件（Header/Footer/Nav 等）
│   │   └── arco/               # 基于 Arco 的二次封装组件
│   ├── hooks/                  # React Hooks（如 useTheme、useI18n）
│   ├── lib/
│   │   ├── api/                # API 客户端与类型定义（对接后端）
│   │   │   ├── client.ts       # 封装 fetch/axios，支持 SSR/SSG
│   │   │   └── types.ts        # 与后端 OpenAPI 对齐的类型
│   │   ├── config/             # 前端配置（站点元信息、路由常量等）
│   │   └── utils/              # 工具方法（格式化、校验等）
│   ├── styles/
│   │   ├── globals.css
│   │   └── arco-theme.less     # Arco Design 主题定制（按需）
│   ├── i18n/                   # 国际化
│   │   ├── index.ts            # i18n 初始化与 Provider
│   │   └── locales/
│   │       ├── zh-CN.json
│   │       └── en-US.json
│   └── middleware.ts           # 中间件（如 i18n、简单鉴权）
├── scripts/
│   ├── build.mjs
│   └── analyze.mjs             # 构建分析（可选）
├── tests/                      # 单元测试
└── e2e/                        # 端到端测试（Playwright/Cypress 可选）
```

前端说明：
- SSR/SSG：默认使用 App Router 的服务端渲染能力，公共页面 SSR；纯静态内容可使用 SSG。
- Arco Design：通过 ArcoProvider、主题文件（arco-theme.less）实现品牌色与组件风格定制；按需引入、减少体积。
- 国际化：最小集成 zh-CN/en-US，后续可扩展。
- 类型共享：lib/api/types.ts 建议结合后端 OpenAPI 自动生成类型，减少重复劳动。

五、后端目录结构（server/）

遵循 GoFrame 官方工程规范，分层清晰、注释完善，统一配置与中间件。

```
server/
├── go.mod
├── go.sum
├── Makefile                    # 常用开发命令（lint/test/run/build）
├── Dockerfile                  # 后端镜像构建文件
├── config/                     # 配置（分环境覆盖）
│   ├── config.yaml             # 默认配置（端口、数据库、日志等）
│   ├── config.dev.yaml
│   ├── config.test.yaml
│   └── config.prod.yaml
├── cmd/
│   └── main.go                 # 入口（初始化配置、日志、HTTP 服务）
├── internal/
│   ├── cmd/
│   │   └── api.go              # HTTP 服务启动（注册路由、中间件）
│   ├── router/
│   │   └── router.go           # 路由注册（版本化 /api/v1）
│   ├── middleware/
│   │   ├── cors.go             # 跨域
│   │   ├── logger.go           # 访问日志
│   │   └── auth.go             # 简单鉴权（可选）
│   ├── controller/             # 控制器（入参校验、调用业务）
│   │   ├── user.go
│   │   ├── profile.go
│   │   └── health.go           # 健康检查
│   ├── service/                # 业务逻辑（事务、聚合）
│   │   ├── user.go
│   │   └── profile.go
│   ├── dao/                    # 数据访问（ORM/SQL）
│   │   ├── user.go
│   │   └── profile.go
│   ├── model/                  # 数据模型
│   │   ├── entity/             # 数据库实体（gf gen 生成）
│   │   └── do/                 # Data Object（查询/更新参数）
│   ├── pkg/
│   │   ├── utils/
│   │   └── validator/
│   └── api/
│       └── openapi.yaml        # 接口契约（用于前端类型生成）
├── resource/
│   └── i18n/                   # 多语言资源（后端消息）
└── scripts/
    ├── migrate.ps1             # 迁移执行（Windows PowerShell 示例）
    └── seed.ps1                # 初始化数据
```

后端说明：
- 配置管理：config.*.yaml 支持分环境覆盖，数据库连接、日志级别、端口等在此管理。
- 路由版本化：统一以 /api/v1 暴露接口，便于后续升级。
- 数据访问：优先使用 GoFrame 提供的 ORM 能力，复杂查询可写原生 SQL；保持 DAO 与 Service 解耦。
- OpenAPI：随着接口迭代及时更新 openapi.yaml，前端可用此生成类型与客户端代码。

六、数据库目录结构（db/）

使用迁移文件管理数据库版本，按顺序执行，保证环境一致性；提供种子数据用于开发联调。

```
db/
├── migrations/                 # 迁移脚本（顺序执行）
│   ├── 0001_init_users.sql
│   ├── 0002_init_profiles.sql
│   └── 0003_init_misc.sql
├── seeds/
│   └── dev/
│       ├── users.sql
│       └── profiles.sql
└── tools/                      # 迁移工具配置（可选）
    └── migrate.json
```

数据库说明：
- 版本：PostgreSQL 18（容器镜像与云服务选择时注意版本匹配）。
- 迁移命名：严格按 4 位递增编号 + 描述命名，避免冲突（例如 0001_init_users.sql）。
- 外键与索引：在迁移中显式声明，保证查询性能与数据一致性。

七、部署与运维目录（deploy/）

本地与开发环境采用 Docker Compose，生产可选 Kubernetes（或继续 Compose）。

```
deploy/
├── docker/
│   ├── compose.yml             # 一键启动 web/server/db
│   ├── nextjs.dockerfile       # 前端镜像（可使用 node:20-alpine）
│   ├── goframe.dockerfile      # 后端镜像（golang 构建 + distroless 运行）
│   └── postgres.env            # 数据库环境变量（用户、密码、库名）
└── k8s/                        # 生产可选（按需）
    ├── web-deployment.yaml
    ├── server-deployment.yaml
    ├── postgres-statefulset.yaml
    └── ingress.yaml
```

八、环境与配置文件约定

- 环境划分：dev/test/prod 三层；本地开发默认 dev。
- 前端 .env 变量：NEXT_PUBLIC_API_BASE 等前端可见变量以 NEXT_PUBLIC_ 前缀约定。
- 后端配置：统一在 config.*.yaml 管理，敏感信息通过环境变量注入（不入库、不入 Git）。
- 数据库连接串：优先环境变量注入，Compose/K8s 使用 secrets 管理。

九、开发流程建议

1) 初始化数据库：按 db/migrations 顺序执行迁移，再执行 dev 种子数据。
2) 启动后端：server/cmd/main.go 启动 HTTP 服务，访问 /api/v1/health 验证。
3) 启动前端：front-web 开发模式（npm run dev），通过 SSR 页面调用后端 API。
4) 类型生成：基于 server/internal/api/openapi.yaml 生成前端 lib/api/types。
5) 测试与质量：前端（unit/e2e）、后端（unit/integration），Lint 与 CI 集成。

十、命名与注释规范（重要）

- 命名统一：英文小写、连字符（前端文件夹）、下划线（SQL）、驼峰（Go/TS 代码）。
- 注释要求：严格遵循仓库 .trae/rules 中“代码中必须有详细的注释”的要求：
  - 关键模块（controller/service/dao、页面与组件）必须包含功能、入参、出参、异常说明。
  - 复杂逻辑需给出流程概述与边界条件说明。
  - SQL 迁移需注明表结构设计意图、索引与约束原因。

十一、后续扩展规划（可选）

- 个人内容 CMS：新增 admin 后台（可独立 Next.js 项或同仓库子应用）。
- 构建优化：按需组件、路由级代码分割、图片优化、CDN 缓存策略。
- 监控与日志：前端 Web Vitals 上报，后端 Prometheus + Grafana，集中日志。
- 安全与鉴权：后端 JWT/OAuth2，前端路由守卫与登录态管理。

以上结构可在不影响现有 docs 的基础上逐步落地，实现前后端联动、配置分层与可维护性。

十二、当前进展（更新）

- 已创建后端模板：使用 GoFrame 脚手架在 server/ 生成基础工程，并将端口更新为 :8080；可在本地成功运行，提供 /hello、/swagger、/api.json。
- 已创建前端模板：使用 create-next-app 在 front-web/ 生成 Next.js App Router + TypeScript 工程；已安装并接入 Arco Design，全局样式与 ConfigProvider 通过客户端组件注入，开发服务器运行于 http://localhost:3000/。
- 文档更新：docs/server/goframe.md 增补脚手架与运行说明；docs/db/db.md 增补 PostgreSQL 18 连接配置与迁移/种子数据规划。

十三、功能模块进展

### 每日一句功能（已完成）
- **功能描述**: 展示来自金山词霸的每日英语句子，包含英文原文、中文翻译、背景图片和音频播放
- **技术实现**:
  - 后端：GoFrame 控制器 + 服务层，调用金山词霸公开API
  - 前端：React 组件 + CSS Modules，支持响应式设计
  - 特色功能：图片主色调提取、音频播放、毛玻璃效果、导航栏颜色自适应
- **API接口**: `GET /daily/sentence` - 获取每日一句数据
- **最新优化**: 
  - 导航栏颜色优化（2025-01-27）：解决图片加载前的蓝色闪烁问题，改为白色默认，只在图片加载完成后才更新为提取的主色调
  - 添加图片加载状态跟踪，完善错误处理机制
- **文件位置**:
  - 后端：`server/internal/controller/daily/`、`server/internal/service/daily.go`
  - 前端：`front-web/src/components/DailySentence.tsx`、`front-web/src/contexts/ColorContext.tsx`
  - 文档：`docs/api/daily.md`、`docs/execute/daily-sentence-implementation.md`、`docs/execute/2025-01-27-navbar-color-optimization.md`

### 访问统计功能（已完成）
- **功能描述**: 记录用户访问信息，支持PostgreSQL和文件存储
- **API接口**: `POST /logs/visit` - 记录访问日志
- **文件位置**:
  - 后端：`server/internal/controller/visit/`、`server/internal/service/visit.go`
  - 前端：`front-web/src/components/VisitTracker.tsx`

### CORS配置（已完成）
- **配置说明**: 后端已添加CORS中间件，支持前端跨域请求
- **实现位置**: `server/internal/cmd/cmd.go`

后续 TODO（文档与代码协同）
- 在 docs/api/ 中补充接口契约草稿（OpenAPI），与后端 internal/api/openapi.yaml 对齐。
- 在 docs/execute/ 增加本地开发一键启动说明（Docker Compose 与脚本），以及联调步骤。
- 在 server/ 配置 PostgreSQL 连接与 dao 层示例；在 front-web/ 增加调用后端 API 的示例页面（如 /profile）。
- 考虑添加更多个人网站功能：博客系统、项目展示、联系表单等。