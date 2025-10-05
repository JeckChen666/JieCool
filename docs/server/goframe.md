# GoFrame

## 基本信息

GoFrame 是一款模块化、高性能的Go 语言开发框架。

GitHub地址：https://github.com/gogf/gf

### 开发环境
- Windows 11 x64

### 语言环境
- go1.24.4 windows/amd64

### 应用框架

— GoFrame v2.9.x

## 脚手架使用与项目初始化

以下步骤用于在本仓库的 server/ 目录创建并运行 GoFrame 基础项目模板：

1) 安装 GoFrame CLI（gf）
   - 执行：
     ```powershell
     go install github.com/gogf/gf/cmd/gf/v2@latest
     ```
   - 注意：Windows 环境下可执行文件默认位于 `$(go env GOPATH)\bin\gf.exe`，例如 `C:\Users\<用户名>\go\bin\gf.exe`。如果未配置 PATH，可用绝对路径运行。

2) 使用脚手架初始化项目模板
   - 在仓库根目录执行：
     ```powershell
     & "C:\Users\<用户名>\go\bin\gf.exe" init server
     ```
   - 说明：该命令会在当前目录生成 `server/` 工程，包含 `main.go`、`internal/*`、`manifest/config/*` 等基础结构。

3) 配置服务端口（避免端口占用）
   - 默认端口为 `:8000`，如被占用可修改为 `:8080`：
     - 文件：`server/manifest/config/config.yaml`
     - 配置：
       ```yaml
       server:
         address: ":8080"
         openapiPath: "/api.json"
         swaggerPath: "/swagger"
       ```

4) 运行服务（开发模式）
   - 进入后端目录并运行：
     ```powershell
     cd server
     & "C:\Users\<用户名>\go\bin\gf.exe" run main.go
     ```
   - 成功输出示例：
     ```text
     http server started listening on [:8080]
     swagger ui:   http://127.0.0.1:8080/swagger/
     openapi spec: http://127.0.0.1:8080/api.json
     routes: GET /hello
     ```

5) 常见问题与排查
   - 端口占用：更换 `server.address` 配置或关闭冲突服务。
   - gf 不在 PATH：使用绝对路径运行（见步骤 1）。
   - 数据库连接失败：请在配置文件中正确设置 PostgreSQL 连接（见下文）。

## 数据库配置（PostgreSQL 18）

默认模板中的 `manifest/config/config.yaml` 使用的是 MySQL 示例链接，请按项目规划替换为 PostgreSQL：

- 文件：`server/manifest/config/config.yaml`
- 示例配置：
  ```yaml
  database:
    default:
      # 连接串格式：pgsql:<user>:<pass>@tcp(<host>:<port>)/<database>
      link: "pgsql:admin:123456@tcp(127.0.0.1:5432)/JieCool"
  ```

建议先创建数据库与用户，并在本地或 Docker 中启动 PostgreSQL 18，确保服务可用。

## 目录结构说明（脚手架生成）

- `main.go`：入口文件，启动 HTTP 服务。
- `internal/controller`：控制器层，处理请求与响应。
- `internal/service`：业务逻辑层，封装领域逻辑与事务。
- `internal/dao`：数据访问层，负责数据库读写（ORM/SQL）。
- `manifest/config`：配置文件（端口、数据库、日志）。
- `resource`：静态资源与模板。

请遵循仓库 `.trae/rules` 要求，关键模块与复杂逻辑需补充详细注释（功能、入参/出参、异常与边界条件）。