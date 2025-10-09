文档概览（docs 文件夹）

作用与价值
- 单一事实来源：记录架构设计、接口契约、数据库方案、执行与修复日志，避免信息分散。
- 协作与交付：为开发、测试、运维、产品提供一致的参考，支撑评审与验收。
- 可追溯：以变更记录与日期命名的文档沉淀决策过程与问题修复过程。
- 上手与培训：新成员可通过 docs 快速了解项目结构、技术栈与约定。

目录结构说明（当前仓库）
- api/
  - 接口文档与契约说明（如 daily.md、file_api.md、visit.md、file-stats.md）。
  - 建议与后端 OpenAPI 对齐，便于前端生成类型。
- attention/
  - 注意事项与通用规范（如 README.md），记录跨团队需要关注的点。
- db/
  - 数据库设计与使用说明（db.md）。
  - 包含 PostgreSQL 18 的连接配置、迁移/种子策略、核心表结构（files、file_download_logs、logs_visit_access 等）。
- depend/
  - 外部依赖与第三方资源记录（index.md），如组件库、工具、API 资源说明。
- execute/
  - 执行与修复日志（按日期命名），例如：
    - 2025-10-07-binary-data-corruption-fix.md
    - 2025-10-07-file-delete-fix.md
    - 2025-10-07-file-integrity-fix.md
    - 2025-10-07-file-stats-fix.md
    - 2025-10-07-md5-display-fix.md
    - 2025-10-07-navbar-color-optimization.md
  - 记录问题现象、根因分析、修复策略与验证结果。
- front-web/
  - 前端相关文档（Next.js、Arco Design 等）。
  - nextjs_doc/ 中包含前端约定与规范，如：
    - route-registry-convention.md：测试页面路径登记规范（新增页面需在 src/app/test/page.tsx 的 routes 数组登记，使用 Arco Table 展示，禁用分页）。
- project.md
  - 项目总体结构设计与约定（技术栈、目录结构、流程、规范等）。
- resource/
  - 文档使用的资源文件（如图片 test.png、外部资料 iciba.md 等）。
- server/
  - 后端 GoFrame 相关文档（goframe.md、goframe_doc/）。

维护与更新规范
- 命名约定：
  - 修复/执行类文档使用日期前缀：YYYY-MM-DD-主题.md（示例：2025-10-07-file-integrity-fix.md）。
  - 主题使用英文短语或下划线连接的关键字，保持简洁可检索。
- 内容要求：
  - 必须包含背景/目的、设计/方案、实现/接口、测试/验证、注意事项/风险等结构化内容。
  - 关键代码、SQL、命令行请给出片段或路径指引，避免“只有结论，没有过程”。
- 更新流程：
  1) 变更前评审：在对应文档增加“变更原因与目标”。
  2) 变更后补充：更新接口/数据库/流程说明，补充验证结果与影响范围。
  3) 交叉链接：相关文档间互相链接（例如接口变更同时链接到 execute 修复文档与前端说明）。
- 角色与责任：
  - 研发负责设计与实现文档更新；测试负责验证与结果记录；运维负责部署与监控文档补充。

交叉引用与定位
- 文件管理功能：
  - 接口：docs/api/file_api.md
  - 数据库：docs/db/db.md（files、file_download_logs 等表结构与索引）
  - 修复记录：docs/execute/ 下的多个 fix 文档
  - 前端说明：docs/front-web/nextjs_doc/route-registry-convention.md（测试页路径登记）
- 每日一句功能：
  - 接口：docs/api/daily.md
  - 资源：docs/resource/iciba.md

文档协作建议
- 使用简洁、统一的术语与格式；尽量以要点 + 有序步骤的形式编写，减少长段落。
- 在提交代码的同时提交对应的文档更新（Docs as Code），保持代码与文档同步。
- 对关键决策（技术选型、架构调整、数据结构变更）建立独立文档，并在 project.md 中留入口。

快速开始（建议阅读顺序）
1) project.md：了解总体结构与约定。
2) db/db.md：了解数据库方案与表结构。
3) api/*：了解接口契约与调用方式。
4) front-web/nextjs_doc/*：了解前端页面布局、路由登记等规范。
5) execute/*：了解关键修复与执行记录，掌握问题与解决方案。

备注
- 若存在与 docs 重复且较旧的文档（例如历史 server/docs），请以 docs/ 为主并清理冗余。
- 如需导入外部文档或图片，请统一放置在 resource/ 并在相关文档中引用路径。