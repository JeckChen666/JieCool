# JieCool 一键部署方案设计文档

## 项目概述

创建一个完整的一键部署解决方案，支持从Windows开发环境打包，到CentOS服务器一键部署的完整流程。

## 设计目标

1. **Windows端自动化打包**：自动构建前后端，生成部署包
2. **服务器端一键部署**：解压后自动配置并启动服务
3. **简化运维流程**：支持更新、备份、监控等运维操作
4. **配置管理**：通过配置文件管理不同环境的部署参数

## 文件结构设计

```
deploy/
├── DEPLOYMENT_PLAN.md           # 部署方案文档（本文件）
├── package/                     # 打包工具目录
│   ├── build.bat               # Windows打包脚本
│   ├── config.env              # 配置文件模板（用户配置）
│   ├── README.md               # 打包工具说明
│   └── templates/              # 配置文件模板目录（build.bat会打包这些）
│       ├── server/            # 后端配置文件模板
│       │   ├── config.yaml    # GoFrame主配置模板
│       │   └── logger.yaml    # 日志配置模板
│       ├── nginx/             # Nginx配置模板
│       │   ├── nginx.conf     # Nginx主配置模板
│       │   ├── jiecool.conf   # JieCool站点配置模板
│       │   └── ssl.conf       # SSL配置模板
│       ├── systemd/           # Systemd服务配置模板
│       │   ├── jiecool-backend.service
│       │   ├── jiecool-frontend.service
│       │   └── jiecool-proxy.service
│       └── scripts/           # 服务器管理脚本模板
│           ├── deploy.sh     # 主部署脚本
│           ├── update.sh     # 更新脚本
│           ├── backup.sh     # 备份脚本
│           ├── start.sh      # 启动脚本
│           ├── stop.sh       # 停止脚本
│           ├── status.sh     # 状态检查脚本
│           ├── logs.sh       # 日志查看脚本
│           └── uninstall.sh  # 卸载脚本
├── zip/                        # 部署包输出目录
│   └── jiecool-deploy-v1.0.0-YYYYMMDDHHMMSS.zip  # 自动生成的部署包
└── tools/                      # 辅助工具
    ├── health-check.sh        # 健康检查工具
    ├── monitor.sh              # 监控工具
    └── cleanup.sh              # 清理工具
```

## 配置文件模板说明

### 简单说明

所有配置文件模板都放在 `deploy/package/templates/` 文件夹中，打包时会自动复制到部署包里。

### 每个文件的作用说明

**📁 后端配置文件 (server/)**
- `config.yaml` - GoFrame后端的主要配置文件（数据库连接、端口等）
- `logger.yaml` - 日志配置文件（日志格式、存储位置等）

**📁 前端反向代理配置 (nginx/)**
- `nginx.conf` - Nginx主配置文件（全局设置）
- `jiecool.conf` - JieCool网站的代理配置（**最重要**：将域名请求转发到后端8080端口）
- `ssl.conf` - HTTPS证书配置文件（SSL证书设置）

**📁 系统服务配置 (systemd/)**
- `jiecool-backend.service` - 后端服务配置（开机自启动、重启策略等）
- `jiecool-frontend.service` - 前端服务配置（如果需要独立运行前端）
- `jiecool-proxy.service` - Nginx代理服务配置

**📁 管理脚本 (scripts/)**
- `deploy.sh` - 一键部署脚本（安装所有服务）
- `start.sh` - 启动所有服务
- `stop.sh` - 停止所有服务
- `restart.sh` - 重启所有服务
- `status.sh` - 查看服务运行状态
- `logs.sh` - 查看日志文件
- `backup.sh` - 备份数据库和文件
- `update.sh` - 更新版本
- `uninstall.sh` - 卸载整个应用

### 关键文件详细说明

**`jiecool.conf` (最重要的配置文件)**
```
# 作用：告诉Nginx如何处理用户请求
server {
    listen 80;
    server_name your-domain.com;

    # 前端页面
    location / {
        proxy_pass http://localhost:3000;
    }

    # 后端API
    location /api/ {
        proxy_pass http://localhost:8080;
    }

    # 文件上传下载
    location /file/ {
        proxy_pass http://localhost:8080;
    }
}
```

**`config.yaml` (后端主配置)**
```yaml
# 作用：配置后端应用的运行参数
server:
  address: ":8080"  # 后端监听端口

database:
  default: "postgres:用户名:密码@tcp(localhost:5432)/数据库名"
```

### 打包时会发生什么

**build.bat 会做这些事：**
1. 复制 `deploy/package/templates/` 里的所有文件
2. 放到部署包的对应位置
3. 生成 `config.env` 文件供用户修改

### 用户需要做什么

**用户只需要修改：**
1. **`config.env`** - 修改数据库密码、域名等基本信息
2. （可选）如果需要特殊配置，可以修改 `templates/` 里的模板文件

### deploy.sh 脚本详细执行流程

**deploy.sh 一键部署脚本会按以下顺序执行：**

#### 1. 环境检查阶段
- 检查操作系统是否为 CentOS 7/8
- 检查当前用户是否有 sudo 权限（用于安装Nginx和配置防火墙）
- 检查必要的系统端口是否可用（8080, 80, 443）
- **检查数据库连接配置**：
  - 尝试连接 `config.env` 中配置的数据库
  - 如果连接失败，提供详细的错误信息
  - 不强制要求PostgreSQL的安装方式

#### 2. 用户和权限设置
- 创建 `jiecool` 系统用户和用户组
- 获取当前解压目录路径（如 `/home/user/jiecool-deploy-v1.0.0/`）
- 在当前目录下创建 `jiecool` 运行目录
- 设置目录权限：`chown -R jiecool:jiecool ./jiecool/`
- 在 `jiecool` 目录下创建子目录：
  - `logs/` - 应用日志目录
  - `data/` - 应用数据目录
  - `backup/` - 备份目录
  - `uploads/` - 上传文件目录

#### 3. 安装系统依赖
- **检查 Nginx 状态**：
  - 如果已安装：使用现有 Nginx，配置站点
  - 如果未安装：提供详细的安装指导文档，不强制安装
- **防火墙检测**：
  - 检测防火墙状态，提供端口开放指导
  - 不强制修改防火墙配置
- **PostgreSQL 依赖检查**：
  - 如果使用 `psql` 命令，确保可用
  - 如果使用 Docker，确保 Docker 服务运行
  - 如果使用远程数据库，确保网络连通性
  - 不强制安装数据库本身

#### 4. 防火墙配置指导
**如果使用 firewalld：**
```bash
# 检查防火墙状态
firewall-cmd --state

# 开放必要端口
sudo firewall-cmd --permanent --add-port=80/tcp    # HTTP
sudo firewall-cmd --permanent --add-port=443/tcp   # HTTPS
sudo firewall-cmd --permanent --add-port=8080/tcp  # 后端API
sudo firewall-cmd --reload

# 验证端口开放
firewall-cmd --list-ports
```

**如果使用 iptables：**
```bash
# 开放端口
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT

# 保存规则
sudo service iptables save
```

**注意：部署脚本只会检测防火墙状态，不会强制修改配置**

#### 4.1. Nginx 安装指导

**CentOS 7/8 安装 Nginx：**

**方法一：使用 EPEL 仓库（推荐）**
```bash
# CentOS 7
sudo yum install epel-release
sudo yum install nginx

# CentOS 8
sudo dnf install epel-release
sudo dnf install nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

**方法二：使用 Nginx 官方仓库**
```bash
# 安装仓库配置
sudo rpm -Uvh http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm

# 安装 Nginx
sudo yum install nginx

# 启动服务
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Ubuntu/Debian 安装 Nginx：**
```bash
# 更新包列表
sudo apt update

# 安装 Nginx
sudo apt install nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

**验证 Nginx 安装：**
```bash
# 检查版本
nginx -v

# 检查配置文件语法
nginx -t

# 测试访问
curl http://localhost
```

**注意：部署脚本会自动检测 Nginx 是否已安装，如果未安装会显示上述安装指导**

#### 5. 解压和文件放置
- 获取当前脚本执行目录（用户解压部署包的目录）
- 在当前目录下创建 `jiecool` 运行目录
- 复制文件到 `jiecool/` 目录下的子目录：
  - 后端二进制文件 → `./jiecool/server/main.exe`
  - 前端文件 → `./jiecool/frontend/`
  - 配置文件模板 → `./jiecool/templates/`
  - 管理脚本 → `./jiecool/scripts/`

#### 6. 配置文件生成和安装

**6.1 后端配置文件处理**
- 读取 `config.env` 中的数据库配置
- 生成 `./jiecool/server/manifest/config/config.yaml`
- 配置数据库连接、服务端口、日志路径等
- 设置文件权限：`chmod 644`
- 日志路径设置为：`./jiecool/logs/backend/`

**6.2 Nginx配置文件处理**
- 复制 `jiecool.conf` 模板到 `/etc/nginx/sites-available/`
- 替换模板中的占位符（域名、端口等）
- 创建软链接：`ln -s /etc/nginx/sites-available/jiecool.conf /etc/nginx/sites-enabled/`
- 配置SSL证书路径（如果启用HTTPS）
- 测试Nginx配置语法：`nginx -t`

**6.3 Systemd服务配置**
- 复制 `.service` 文件到 `/etc/systemd/system/`
- 重新加载 systemd：`systemctl daemon-reload`
- 设置服务开机自启动

#### 7. 数据库操作
- 使用 `config.env` 中的配置连接数据库
- 执行数据库迁移脚本：
  ```bash
  /opt/jiecool/server/main.exe migrate up
  ```
- 导入初始数据（如果有）
- 验证数据库连接和表结构

#### 8. 应用服务启动

**8.1 启动后端服务**
```bash
cd ./jiecool
nohup ./server/main.exe > logs/backend/startup.log 2>&1 &
echo $! > backend.pid
```

**8.2 启动前端服务（如果需要）**
```bash
cd ./jiecool/frontend
nohup npm start > ../logs/frontend/startup.log 2>&1 &
echo $! > frontend.pid
```

**8.3 启动Nginx代理（系统级服务）**
```bash
systemctl start jiecool-proxy
systemctl enable jiecool-proxy
```

#### 9. 健康检查和验证
- 检查后端进程：`ps aux | grep main.exe`
- 检查Nginx服务：`systemctl status jiecool-proxy`
- 测试后端API：`curl http://localhost:8080/api/hello`
- 测试前端页面：`curl http://localhost/`
- 检查日志输出：`tail -f ./jiecool/logs/backend/startup.log`
- 验证数据库连接

#### 10. 最终设置
- 在 `./jiecool/` 目录创建管理脚本软链接：
  ```bash
  ln -s ./scripts/start.sh ./start.sh
  ln -s ./scripts/stop.sh ./stop.sh
  ln -s ./scripts/status.sh ./status.sh
  ln -s ./scripts/logs.sh ./logs.sh
  ```
- 生成部署报告文件：`./jiecool/deployment-report.json`
- 显示部署结果和访问信息
- 清理临时文件

#### 11. 错误处理和回滚
- 如果任何步骤失败，脚本会：
  - 显示错误信息和日志位置
  - 停止已启动的服务
  - 保留失败前的状态
  - 提供手动修复建议

#### 12. 完成信息输出
部署成功后会显示：
```
========================================
JieCool 部署完成！
========================================
后端服务: http://localhost:8080
前端页面: http://localhost/
部署目录: $(pwd)/jiecool/
管理命令:
  启动: ./start.sh
  停止: ./stop.sh
  状态: ./status.sh
  日志: ./logs.sh backend
  备份: ./backup.sh
========================================
```

### 部署过程中产生的文件

**应用目录结构（相对路径）：**
```
jiecool-deploy-v1.0.0-YYYYMMDDHHMMSS/
├── jiecool/                    # 主运行目录
│   ├── server/              # 后端文件
│   │   ├── main.exe        # 后端可执行文件
│   │   └── manifest/       # GoFrame配置
│   ├── frontend/           # 前端文件
│   │   ├── out/           # 静态文件
│   │   └── server/        # Next.js服务端文件
│   ├── logs/               # 日志文件
│   │   ├── backend/      # 后端日志
│   │   ├── frontend/     # 前端日志
│   │   └── nginx/        # Nginx日志
│   ├── data/               # 应用数据
│   ├── uploads/            # 用户上传文件
│   ├── backup/             # 备份文件
│   ├── templates/          # 配置文件模板
│   └── scripts/            # 管理脚本
├── config.env              # 用户配置文件
├── deploy.sh              # 主部署脚本
└── README.md              # 使用说明
```

**配置文件位置：**
- `./jiecool/server/manifest/config/config.yaml` - 后端主配置
- `/etc/nginx/sites-available/jiecool.conf` - Nginx站点配置
- `/etc/systemd/system/jiecool-proxy.service` - 代理服务配置

**日志文件位置：**
- `./jiecool/logs/backend/` - 后端应用日志
- `./jiecool/logs/nginx/` - Nginx代理日志
- `./jiecool/logs/frontend/` - 前端服务日志

**数据文件位置：**
- `./jiecool/data/` - 应用运行数据
- `./jiecool/uploads/` - 用户上传文件
- `./jiecool/backup/` - 备份文件

### 部署后如何管理应用

**使用示例：**
```bash
# 在部署目录下执行
cd jiecool-deploy-v1.0.0-20251105000927

# 查看应用状态
./status.sh

# 查看后端日志
./logs.sh backend

# 查看前端日志
./logs.sh frontend

# 重启应用
./stop.sh
./start.sh

# 备份数据库
./backup.sh

# 更新版本（上传新包后）
# 解压新包，然后运行：
./update.sh
```

## 部署包内容设计

### zip包结构（jiecool-deploy-版本号.zip）
```
jiecool-deploy-v1.0.0-YYYYMMDDHHMMSS.zip
├── README.md                   # 部署说明
├── CHANGELOG.md                # 版本更新日志
├── config.env                  # 环境配置文件（用户修改）
├── deploy.sh                   # 一键部署脚本
├── VERSION                     # 版本信息文件
├── TIMESTAMP                   # 时间戳文件
├── PACKAGE_NAME               # 包名称文件
├── server/                     # 后端文件
│   ├── main.exe                # Linux二进制文件（交叉编译）
│   ├── manifest/               # GoFrame配置文件目录
│   │   └── config/             # 配置文件（config.yaml等）
│   ├── migrations/             # 数据库迁移脚本
│   │   ├── *.sql              # SQL迁移文件
│   │   └── README.md         # 迁移说明
│   └── init_data/              # 初始化数据
│       ├── *.sql              # 初始数据SQL文件
│       └── README.md         # 初始数据说明
├── frontend/                   # 前端文件
│   ├── cache/                  # Next.js缓存文件
│   │   ├── swc/              # SWC编译缓存
│   │   └── webpack/          # Webpack缓存
│   ├── public/                 # 静态资源文件
│   │   ├── favicon.ico
│   │   ├── *.svg
│   │   └── *.png
│   ├── server/                 # Next.js服务端构建
│   │   ├── app/               # App Router页面
│   │   ├── chunks/           # 构建块
│   │   ├── pages/            # 静态页面
│   │   └── *.json            # 构建清单文件
│   ├── static/                 # 静态资源
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   ├── types/                  # TypeScript类型定义
│   ├── out/                    # 导出的静态文件（实际部署时使用）
│   ├── package.json            # 前端依赖配置
│   ├── build-manifest.json      # 构建清单
│   ├── routes-manifest.json     # 路由清单
│   └── trace                   # 构建追踪信息
├── nginx/                      # Nginx配置文件
│   ├── nginx.conf              # 主配置文件
│   └── sites-available/         # 站点配置模板
│       ├── jiecool.conf      # JieCool站点配置
│       └── ssl.conf          # SSL配置模板
├── systemd/                    # 系统服务配置
│   ├── jiecool-backend.service  # 后端服务配置
│   ├── jiecool-frontend.service # 前端服务配置
│   └── jiecool-proxy.service    # 代理服务配置
├── scripts/                    # 管理脚本
│   ├── deploy.sh              # 主部署脚本
│   ├── update.sh              # 更新脚本
│   ├── backup.sh              # 备份脚本
│   ├── start.sh               # 启动脚本
│   ├── stop.sh                # 停止脚本
│   ├── status.sh              # 状态检查脚本
│   ├── logs.sh                # 日志查看脚本
│   └── uninstall.sh           # 卸载脚本
└── tools/                      # 辅助工具
    ├── health-check.sh        # 健康检查工具
    ├── monitor.sh              # 监控工具
    ├── cleanup.sh              # 清理工具
    └── restore.sh              # 恢复工具
```

### 配置文件详细说明

**后端配置文件位置**：
- `server/manifest/config/config.yaml` - GoFrame主配置文件
- `server/manifest/config/` - 其他配置文件目录
- 配置文件包含：数据库连接、服务端口、日志设置等

**前端配置文件位置**：
- `frontend/package.json` - Node.js依赖和构建脚本
- Next.js配置已内置在构建输出中
- 环境变量通过 `config.env` 注入

**部署配置文件**：
- `config.env` - 主要配置文件，包含所有环境变量
- 包含数据库、端口、域名等配置
- 部署时用户需要修改此文件

## 功能设计

### 1. Windows端打包工具

**build.bat 主要功能**：
- 检测依赖环境（Go, Node.js）
- 清理旧的打包文件
- 构建后端（交叉编译到Linux）
- 构建前端（生产环境）
- 复制必要文件和配置
- 创建配置模板
- 生成部署包
- 计算文件校验和

**create-deploy-package.py 主要功能**：
- 跨平台打包工具
- 版本管理
- 配置文件生成
- 依赖检查
- 打包压缩

### 2. 服务器端部署脚本

**deploy.sh 主要功能**：
- 系统环境检查
- 依赖安装（Nginx等）
- 文件解压和放置
- 配置文件生成
- 权限设置
- 服务注册
- 数据库迁移（可选）
- 服务启动
- 健康检查

**update.sh 主要功能**：
- 服务停止
- 备份当前版本
- 更新文件
- 数据库迁移
- 服务重启
- 回滚机制

### 3. 配置管理

**config.env 环境变量**：
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=JieCool
DB_USER=jiecool_user
DB_PASSWORD=your_secure_password_here

# 服务器配置
BACKEND_PORT=8080
FRONTEND_PORT=3000
DOMAIN=your-domain.com

# 部署用户配置
DEPLOY_USER=jiecool
DEPLOY_GROUP=jiecool

# 其他配置
LOG_LEVEL=info
ENABLE_SSL=false
```

### 配置文件部署位置

**1. 后端配置文件**：
- 配置文件目录：`/opt/jiecool/server/manifest/config/`
- 主配置文件：`/opt/jiecool/server/manifest/config/config.yaml`
- 数据库配置在 `config.yaml` 中，通过环境变量覆盖
- 日志配置：`/opt/jiecool/server/manifest/config/logger.yaml`

**2. 前端配置文件**：
- 静态文件目录：`/opt/jiecool/frontend/`
- 构建输出：`/opt/jiecool/frontend/out/`
- 静态资源：`/opt/jiecool/frontend/static/`
- 服务端文件：`/opt/jiecool/frontend/server/`

**3. Nginx配置文件**：
- 主配置：`/etc/nginx/nginx.conf`
- 站点配置：`/etc/nginx/sites-available/jiecool.conf`
- 启用站点：`/etc/nginx/sites-enabled/jiecool.conf`

**4. Systemd服务配置**：
- 后端服务：`/etc/systemd/system/jiecool-backend.service`
- 前端服务：`/etc/systemd/system/jiecool-frontend.service`
- 代理服务：`/etc/systemd/system/jiecool-proxy.service`

**5. 日志文件位置**：
- 后端日志：`/var/log/jiecool/backend/`
- 前端日志：`/var/log/jiecool/frontend/`
- Nginx日志：`/var/log/nginx/`
- 系统服务日志：`journalctl -u jiecool-*`

**6. 数据文件位置**：
- 应用数据：`/opt/jiecool/data/`
- 备份文件：`/opt/jiecool/backup/`
- 上传文件：`/opt/jiecool/uploads/`
- 临时文件：`/tmp/jiecool/`

## 部署流程设计

### 阶段一：Windows开发环境

1. **环境准备**
   - 安装Go 1.23+
   - 安装Node.js 18+
   - 检查Git环境

2. **执行打包**
   ```cmd
   cd deploy/package
   build.bat
   # 或使用Python工具
   python create-deploy-package.py
   ```

3. **打包完成**
   - 生成部署包到 `deploy/zip/`
   - 包含版本信息和校验和
   - 生成部署说明

### 阶段二：CentOS服务器环境

1. **基础环境**
   - CentOS 7/8
   - PostgreSQL 18
   - 网络访问权限

2. **上传部署包**
   ```bash
   scp deploy/zip/jiecool-deploy-*.zip user@server:/home/user/
   ```

3. **执行部署**
   ```bash
   unzip jiecool-deploy-*.zip
   chmod +x deploy.sh
   ./deploy.sh
   ```

### 阶段三：部署后管理

1. **服务管理**
   - `./start.sh` - 启动服务
   - `./stop.sh` - 停止服务
   - `./status.sh` - 检查状态
   - `./logs.sh` - 查看日志

2. **更新维护**
   - `./update.sh` - 更新部署
   - `./backup.sh` - 数据备份
   - `./health-check.sh` - 健康检查

## 安全考虑

1. **文件权限**
   - 自动设置合适的文件权限
   - 服务用户隔离
   - 关键文件保护

2. **配置安全**
   - 数据库密码加密存储
   - 生产环境配置验证
   - 防火墙配置建议

3. **备份机制**
   - 自动备份策略
   - 版本回滚支持
   - 数据完整性检查

## 扩展功能

### 1. 多环境支持
- 开发/测试/生产环境配置
- 环境特定参数覆盖
- 配置验证和检查

### 2. 监控集成
- 系统资源监控
- 服务状态监控
- 日志聚合分析

### 3. 自动化CI/CD
- Git钩子集成
- 自动打包触发
- 自动部署测试

## 优势

1. **简化部署**：一键部署，减少人工错误
2. **版本管理**：完整的版本控制和回滚机制
3. **配置灵活**：支持多环境和自定义配置
4. **运维友好**：完整的运维工具集
5. **跨平台**：Windows打包，Linux部署

## 下一步实施计划

1. 创建打包工具脚本
2. 设计配置模板
3. 实现部署脚本
4. 编写运维工具
5. 测试和优化流程
6. 编写用户文档

## 注意事项

1. 数据库需要预先安装配置
2. 防火墙需要开放必要端口
3. 域名和SSL证书需要额外配置
4. 定期备份数据和配置文件
5. 监控系统资源使用情况