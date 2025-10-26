# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

JieCool 是一个个人网站项目，采用前后端分离架构：
- 前端：Next.js 14.2.15 (App Router) + TypeScript + Arco Design 2.66.5
- 后端：GoFrame v2.9.3 + PostgreSQL 18
- 主要功能：文件管理、每日一句、访问统计、用户认证、动态配置、微博模块等

## 常用开发命令

### 前端 (front-web/)
```bash
# 开发模式（使用 Turbo 模式，启动开发服务器）
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# E2E 测试（需要先启动开发服务器）
npx playwright test
```

### 后端 (server/)
```bash
# 开发模式运行（推荐，支持热重载）
gf run main.go

# 或者使用传统方式
go run main.go

# 使用 Makefile（推荐，自动安装gf CLI）
make run          # 等同于 gf run main.go
make build        # 构建项目
make ctrl         # 生成控制器代码
make dao          # 生成数据访问层代码
make service      # 生成服务接口
make enums        # 生成枚举
make up           # 更新GoFrame到最新版本

# 直接使用 gf 命令
gf build
gf gen ctrl
gf gen dao
gf gen service
gf gen enums
```

## 项目架构

### 前端架构 (Next.js)
- **路由系统**：使用 App Router，页面路径对应 `src/app/` 目录结构
- **组件库**：Arco Design 2.66.5，全局样式通过 `src/app/layout.tsx` 引入
- **API客户端**：使用 alova 3.3.4 库，配置在 `src/lib/alova.ts`
- **样式方案**：Tailwind CSS 3.4.18 + Arco Design 主题定制
- **测试框架**：Playwright 1.56.0（E2E测试）
- **TypeScript**：严格模式，路径别名 `@/*` 指向 `./src/*`

### 后端架构 (GoFrame)
- **分层架构**：Controller → Service → DAO → Model（Entity）
- **代码生成**：使用 GoFrame CLI 工具生成标准代码结构
- **API版本**：统一使用 `/` 根路径，通过控制器方法区分
- **数据库**：PostgreSQL 18，支持二进制存储和 JSONB
- **认证方式**：JWT (HS256)，使用 golang-jwt/jwt/v5
- **图像处理**：使用 disintegration/imaging v1.6.2 生成缩略图

### 数据库设计
核心表结构：
- `files`：文件存储表（支持二进制内容和缩略图，包含 file_md5 字段）
- `file_download_logs`：文件下载日志
- `logs_visit_access`：访问记录
- `dynamic_configs`：动态配置管理
- `dynamic_config_versions`：配置版本历史
- `weibo_posts`：微博文章
- `weibo_snapshots`：微博快照
- `weibo_assets`：微博资源

## 重要约定

### 代码规范
- **注释要求**：所有代码必须包含详细的中文注释
- **命名规范**：
  - 前端：英文小写，连字符分隔
  - 后端：驼峰命名（Go/TS），下划线分隔（SQL）
- **API接口**：必须使用GoFrame代码生成命令创建基础结构

### 文档维护
每次代码变更后必须及时更新对应文档：
- **API变更** → 更新 `docs/api/` 目录
- **需求变更** → 更新 `docs/execute/` 目录
- **数据库变更** → 更新 `docs/db/` 目录
- **依赖变更** → 更新 `docs/depend/` 目录
- **项目变更** → 更新 `docs/project.md`

### 前端特殊要求
- **路由登记**：新增页面必须在 `src/app/test/page.tsx` 的 routes 数组中登记
- **API调用**：使用 alova 客户端，支持自动 token 管理和错误处理
- **响应式设计**：考虑不同设备和屏幕尺寸
- **客户端组件**：使用 React Hooks 的组件必须标记为 "use client"

## 开发流程

### 环境启动
1. **数据库**：确保 PostgreSQL 18 运行并创建相应数据库
   ```yaml
   # 连接配置在 server/manifest/config/config.yaml
   database:
     default:
       link: "pgsql:admin:123456@tcp(127.0.0.1:5432)/JieCool"
   ```
2. **后端**：`cd server && go run main.go`（默认端口8080）
3. **前端**：`cd front-web && npm run dev`（默认端口3000）

### 新功能开发
1. 在 `server/api/` 中定义 API 接口结构
2. 使用 GoFrame 生成基础代码：`gf gen ctrl`
3. 实现业务逻辑（Service层）
4. 更新API文档
5. 开发前端页面和组件
6. 更新路由登记
7. 编写执行文档

### 测试验证
- 前端：使用 Playwright 进行 E2E 测试
- 后端：通过健康检查接口验证服务状态
  - Swagger UI：http://localhost:8080/swagger
  - OpenAPI JSON：http://localhost:8080/api.json

## 当前功能模块

### 已完成功能
- **文件管理**：上传、下载、缩略图生成、MD5校验、软删除/恢复、去重检测
- **每日一句**：金山词霸API集成，图片主色调提取，音频播放
- **访问统计**：记录用户访问信息，支持数据库和文件存储
- **用户认证**：JWT登录，URL Token生成，自动过期处理
- **动态配置**：KV配置管理，进程内缓存，版本历史
- **微博模块**：微博文章管理、快照功能

### API接口概览
- `POST /file/upload` - 文件上传
- `GET /file/download/{file_uuid}` - 文件下载
- `GET /file/info/{file_uuid}` - 获取文件信息
- `GET /file/list` - 文件列表查询
- `DELETE /file/delete/{file_uuid}` - 软删除文件
- `POST /file/restore/{file_uuid}` - 恢复已删除文件
- `GET /file/thumbnail/{file_uuid}` - 获取缩略图
- `GET /file/stats` - 文件统计信息
- `GET /daily/sentence` - 每日一句
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取用户信息
- `POST /auth/generate-url-token` - 生成URL Token
- `GET /config/list` - 获取配置列表
- `POST /config/refresh` - 刷新配置缓存

## 技术栈详情

### 前端依赖 (package.json)
- Next.js 14.2.15
- React 18.3.1
- TypeScript 5.x
- Arco Design 2.66.5
- alova 3.3.4
- Tailwind CSS 3.4.18
- Playwright 1.56.0

### 后端依赖 (go.mod)
- GoFrame v2.9.3
- Go 1.23.0 (toolchain go1.24.4)
- PostgreSQL Driver v2.9.3
- JWT Library v5.3.0
- Image Processing v1.6.2

## 目录结构关键差异

### 实际前端结构
```
front-web/src/
├── app/                    # App Router 页面
│   ├── admin/             # 管理页面
│   ├── file-management/   # 文件管理
│   ├── login/            # 登录页面
│   ├── test/             # 测试页面（路由登记）
│   └── weibo/            # 微博模块
├── components/           # 组件
│   ├── features/        # 功能组件
│   ├── layout/          # 布局组件
│   └── ui/              # UI 组件
├── lib/                 # 工具库
│   ├── alova.ts        # API 客户端
│   ├── token.ts        # Token 管理
│   └── *-api.ts        # 各模块 API
└── contexts/           # React Context
```

### 实际后端结构
```
server/
├── internal/
│   ├── cmd/            # 命令行入口
│   ├── controller/     # 控制器
│   ├── service/        # 业务逻辑
│   ├── dao/           # 数据访问
│   ├── model/         # 数据模型
│   │   ├── entity/    # 数据库实体
│   │   ├── do/        # Data Object
│   │   └── response/  # 响应结构
│   └── middleware/    # 中间件
├── manifest/config/    # 配置文件
└── api/               # API 定义
```

## 注意事项

- **中文优先**：所有注释、文档、用户界面文本使用简体中文
- **依赖管理**：引入新依赖前需要说明用途和潜在问题
- **代码质量**：考虑可维护性、可扩展性、性能等因素
- **安全考虑**：文件类型验证、路径安全、JWT管理等
- **数据库**：使用 GoFrame ORM，支持 PostgreSQL 18 特性
- **配置管理**：通过动态配置系统管理运行时配置
- **错误处理**：统一的错误响应格式和前端提示
- **开发效率**：使用 Turbo 模式提升前端开发体验