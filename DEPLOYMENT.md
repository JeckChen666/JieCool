# JieCool 部署教程

## 概述

JieCool 是一个前后端分离的 Web 应用：
- **后端**: GoFrame + PostgreSQL
- **前端**: Next.js + Arco Design
- **部署方式**: Linux 服务器 + Nginx 反向代理

## 系统要求

### 服务器要求
- **操作系统**: CentOS 7/8, Ubuntu 18.04+, Debian 9+
- **CPU**: 1核心以上
- **内存**: 2GB 以上
- **磁盘**: 10GB 以上可用空间
- **网络**: 公网 IP 或内网访问

### 软件依赖
- **Go**: 1.23+ (如果需要在服务器上编译)
- **Node.js**: 18+ (如果需要在服务器上构建前端)
- **PostgreSQL**: 12+ (推荐 15+)
- **Nginx**: 1.18+
- **Git**: 用于代码管理

## 快速部署 (推荐)

### 1. 准备服务器环境

#### 安装基础依赖 (CentOS/RHEL)
```bash
# 更新系统
sudo yum update -y

# 安装必要软件
sudo yum install -y git curl wget nginx postgresql postgresql-server postgresql-contrib

# 安装 Node.js (如果需要)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 启动并设置 PostgreSQL
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 安装基础依赖 (Ubuntu/Debian)
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y git curl wget nginx postgresql postgresql-contrib

# 安装 Node.js (如果需要)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 启动并设置 PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 2. 获取项目代码

```bash
# 克隆项目
git clone <your-repo-url> JieCool
cd JieCool

# 或者使用已有代码
cd /path/to/your/JieCool
```

### 3. 配置数据库

#### 创建数据库和用户
```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 中执行以下命令
CREATE USER jiecool WITH PASSWORD 'your_secure_password';
CREATE DATABASE jiecool OWNER jiecool;
GRANT ALL PRIVILEGES ON DATABASE jiecool TO jiecool;
\q
```

#### 配置 PostgreSQL (如果需要自定义端口或远程访问)
```bash
# 编辑配置文件
sudo vim /etc/postgresql/*/main/postgresql.conf

# 修改以下配置:
listen_addresses = 'localhost'
port = 5432  # 或自定义端口

# 编辑访问控制
sudo vim /etc/postgresql/*/main/pg_hba.conf

# 添加行 (允许本地连接):
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

### 4. 配置后端

#### 修改配置文件
项目的配置文件位于 `server/manifest/config/config.yaml`。

**关键配置项需要修改**:
```bash
# 编辑配置文件
vim server/manifest/config/config.yaml
```

**需要修改的配置**:
```yaml
database:
  default:
    # 修改数据库连接串
    # 格式: "pgsql:用户名:密码@tcp(主机:端口)/数据库名"
    link: "pgsql:jiecool:your_secure_password@tcp(localhost:5432)/JieCool"
    debug: false  # 生产环境建议关闭

server:
  address: ":8080"  # 后端端口
  openapiPath: "/api.json"
  swaggerPath: "/swagger"

logger:
  level: "info"  # 生产环境建议使用 info 或 warn
  stdout: true
```

### 5. 编译后端

#### 方式 1: 在服务器上直接编译 (推荐)
```bash
# 安装 Go (如果还没有)
# CentOS/RHEL:
sudo yum install -y golang

# Ubuntu/Debian:
sudo apt install -y golang-go

# 验证 Go 安装
go version

# 编译后端
cd server
go mod download
go mod tidy
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main .
```

#### 方式 2: 在 Windows 上交叉编译
```batch
REM 在 Windows 环境下执行
cd D:\path\to\JieCool\server
set GOOS=linux
set GOARCH=amd64
set CGO_ENABLED=0
go build -o main .

# 然后将 main 文件上传到 Linux 服务器
```

#### 方式 3: 使用 GoFrame 工具
```bash
cd server

# 开发模式运行（推荐，支持热重载）
gf run main.go

# 构建生产版本
gf build

# 生成代码
gf gen ctrl      # 生成控制器代码
gf gen dao       # 生成数据访问层代码
gf gen service   # 生成服务接口
gf gen enums     # 生成枚举
```

### 6. 构建前端

#### 在服务器上构建
```bash
# 进入前端目录
cd front-web

# 安装依赖
npm install

# 构建生产版本 (SSR模式)
npm run build

# 验证构建结果
ls -la .next/  # SSR 模式构建到 .next 目录
```

#### 构建验证
构建成功后会看到 `.next/` 目录包含：
- `server/` - Next.js 服务器文件
- `static/` - 静态资源
- 各种清单和配置文件

**重要**: SSR 模式不会生成 `out/` 静态目录，而是需要运行 Next.js 服务器。

### 7. 启动前端服务器 (SSR模式)

#### 重要说明
您的 Next.js 项目配置为 **SSR (Server-Side Rendering)** 模式，不是静态导出。需要运行 Next.js 服务器。

#### 启动 Next.js 服务器
```bash
# 进入前端目录
cd front-web

# 开发模式启动 (用于测试)
npm run dev

# 或者生产模式启动
npm start
```

#### 使用 PM2 管理前端进程 (推荐)

PM2 是一个流行的 Node.js 应用进程管理器，具有进程守护、日志管理、负载均衡等功能。

##### 安装 PM2
```bash
# 全局安装 PM2
npm install -g pm2

# 验证安装
pm2 --version
```

##### 启动前端服务
```bash
# 进入前端目录
cd front-web

# 启动前端服务（生产模式）
pm2 start npm --name "jiecool-frontend" -- start

# 或者使用更详细的配置
pm2 start npm --name "jiecool-frontend" -- start -- --port 53000

# 或者使用环境变量启动
pm2 start npm --name "jiecool-frontend" -- start --env PORT=53000
```

##### PM2 常用管理命令
```bash
# 查看所有进程状态
pm2 status
pm2 list

# 查看特定进程信息
pm2 show jiecool-frontend

# 启动/停止/重启进程
pm2 start jiecool-frontend
pm2 stop jiecool-frontend
pm2 restart jiecool-frontend
pm2 delete jiecool-frontend    # 删除进程

# 实时查看日志
pm2 logs jiecool-frontend
pm2 logs jiecool-frontend --lines 100  # 查看最近100行日志
pm2 logs --raw                    # 查看所有进程日志

# 监控 CPU 和内存使用
pm2 monit

# 重载应用（零停机重载）
pm2 reload jiecool-frontend
```

##### 创建 PM2 配置文件
为了更好的管理，可以创建 `ecosystem.config.js` 配置文件：

```bash
# 在 front-web 目录下创建配置文件
vim ecosystem.config.js
```

配置文件内容：
```javascript
module.exports = {
  apps: [{
    name: 'jiecool-frontend',
    script: 'npm',
    args: 'start',
    cwd: './front-web',
    instances: 1,           // 进程实例数量
    autorestart: true,      // 自动重启
    watch: false,           // 不监听文件变化（生产环境推荐）
    max_memory_restart: '1G', // 内存超过 1GB 时重启
    env: {
      NODE_ENV: 'production',
      PORT: 53000,
      NEXT_PUBLIC_API_BASE: 'http://localhost:58080'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,             // 日志包含时间戳
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000,
      NEXT_PUBLIC_API_BASE: 'http://localhost:8080'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 53000,
      NEXT_PUBLIC_API_BASE: 'http://localhost:58080'
    }
  }]
};
```

使用配置文件启动：
```bash
# 使用配置文件启动
pm2 start ecosystem.config.js

# 指定环境启动
pm2 start ecosystem.config.js --env production
pm2 start ecosystem.config.js --env development
```

##### 设置开机自启
```bash
# 生成开机自启脚本
pm2 startup

# 根据提示执行生成的命令（通常需要 sudo 权限）
# 例如：sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u jiecool --hp /home/jiecool

# 保存当前进程列表
pm2 save

# 禁用开机自启
pm2 unstartup
```

##### 日志管理
```bash
# 查看日志文件位置
pm2 show jiecool-frontend | grep "log file path"

# 清理日志
pm2 flush jiecool-frontend  # 清理指定进程日志
pm2 flush                   # 清理所有进程日志

# 日志轮转配置
pm2 install pm2-logrotate  # 安装日志轮转模块
```

##### 性能监控
```bash
# 实时监控面板
pm2 monit

# 查看详细报告
pm2 report

# 查看进程树
pm2 tree
```

##### 进程集群模式
如果需要提高性能，可以启用集群模式：
```javascript
// 修改 ecosystem.config.js
module.exports = {
  apps: [{
    name: 'jiecool-frontend',
    script: 'npm',
    args: 'start',
    instances: 'max',        // 使用所有 CPU 核心
    exec_mode: 'cluster',    // 集群模式
    // ... 其他配置
  }]
};
```

##### 故障排查
```bash
# 查看进程详细信息
pm2 show jiecool-frontend

# 查看最近的错误日志
pm2 logs jiecool-frontend --err --lines 50

# 查看最近的输出日志
pm2 logs jiecool-frontend --out --lines 50

# 重新生成进程列表
pm2 resurrect

# 重置 PM2 元数据
pm2 reset jiecool-frontend
```

##### PM2 环境变量配置
可以通过环境变量控制 PM2 行为：
```bash
# 设置 PM2 日志级别
export PM2_LOG_DATE_FORMAT="YYYY-MM-DD HH:mm:ss Z"

# 设置 PM2 家目录
export PM2_HOME="/custom/pm2/path"

# 启动时应用环境变量
PM2_APP_NAME="jiecool-frontend" pm2 start npm -- start
```

### 8. 配置 Nginx (SSR模式)

由于您的项目是 SSR 模式，Nginx 需要配置为反向代理，而不是静态文件服务。

```bash
# 创建 Nginx 配置文件
sudo vim /etc/nginx/sites-available/jiecool
```

配置文件内容:
```nginx
server {
    listen 80;
    server_name localhost;  # 修改为您的域名

    # Next.js SSR 前端代理
    location / {
        proxy_pass http://127.0.0.1:53000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API 代理到后端服务
    location /api/ {
        proxy_pass http://127.0.0.1:58080/;  # 注意端口与后端配置一致
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 文件上传大小限制
        client_max_body_size 100M;
    }

    # Next.js API 和特殊路由
    location ~ ^/(api|_next|__webpack|favicon|manifest|robots\.txt|sitemap\.xml) {
        proxy_pass http://127.0.0.1:53000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 隐藏 Nginx 版本
    server_tokens off;
}
```

启用站点:
```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/jiecool /etc/nginx/sites-enabled/

# 删除默认站点
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 9. 创建系统服务

#### 后端服务
```bash
# 创建 systemd 服务文件
sudo vim /etc/systemd/system/jiecool-backend.service
```

服务文件内容:
```ini
[Unit]
Description=JieCool Backend Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/app/jiecool/JieCool/server
ExecStart=/app/jiecool/JieCool/server/main
Restart=always
RestartSec=5
Environment=GF_GCFG_FILE=config.yaml

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jiecool-backend

# 文件权限配置
ReadWritePaths=/app/jiecool/JieCool/logs /app/jiecool/JieCool/uploads /app/jiecool/JieCool/server/manifest/config

[Install]
WantedBy=multi-user.target
```

**重要说明**:
- `WorkingDirectory` 和 `ExecStart` 必须使用绝对路径
- 移除了过于严格的安全配置，避免权限问题
- 根据你的实际路径 `/app/jiecool/JieCool/` 进行配置

启动服务:
```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start jiecool-backend

# 设置开机自启
sudo systemctl enable jiecool-backend

# 检查服务状态
sudo systemctl status jiecool-backend
```

### 10. 验证部署

#### 检查服务状态
```bash
# 检查后端服务
sudo systemctl status jiecool-backend

# 检查前端服务 (如果使用 PM2)
pm2 status jiecool-frontend

# 检查 Nginx 服务
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep -E ":80|:53000|:58080|:5432"
```

#### 测试服务
```bash
# 测试后端健康检查
curl http://localhost:58080/api/health

# 测试前端访问
curl -I http://localhost

# 测试前端页面渲染
curl http://localhost | head -20

# 测试前端直接访问（绕过 Nginx）
curl -I http://localhost:53000

# 测试后端 API 直接访问
curl http://localhost:58080/api/health
```

#### 查看日志
```bash
# 查看后端日志
sudo journalctl -u jiecool-backend -f

# 查看前端日志 (如果使用 PM2)
pm2 logs jiecool-frontend

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 域名和 HTTPS 配置

### 配置域名
1. 将域名 A 记录指向服务器 IP
2. 修改 Nginx 配置文件中的 `server_name` 为您的域名
3. 重新加载 Nginx 配置并重启服务

### 配置 HTTPS (使用 Let's Encrypt)
```bash
# 安装 Certbot
# CentOS/RHEL:
sudo yum install -y certbot python3-certbot-nginx

# Ubuntu/Debian:
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加行:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 管理和维护

### 常用管理命令
```bash
# 后端服务管理
sudo systemctl start jiecool-backend      # 启动后端服务
sudo systemctl stop jiecool-backend       # 停止后端服务
sudo systemctl restart jiecool-backend    # 重启后端服务
sudo systemctl status jiecool-backend     # 查看后端状态

# 前端服务管理 (PM2)
pm2 start jiecool-frontend                 # 启动前端服务
pm2 stop jiecool-frontend                  # 停止前端服务
pm2 restart jiecool-frontend               # 重启前端服务
pm2 reload jiecool-frontend                # 零停机重载
pm2 delete jiecool-frontend                # 删除前端进程
pm2 status jiecool-frontend                # 查看前端状态
pm2 show jiecool-frontend                 # 查看前端详细信息
pm2 monit                                  # 实时监控面板

# 日志查看
sudo journalctl -u jiecool-backend -f     # 查看后端实时日志
sudo journalctl -u jiecool-backend -n 100 # 查看后端最近100行
pm2 logs jiecool-frontend                  # 查看前端实时日志
pm2 logs jiecool-frontend --lines 100      # 查看前端最近100行
pm2 logs jiecool-frontend --err            # 只查看错误日志
pm2 flush jiecool-frontend                 # 清理前端日志

# 数据库备份
sudo -u postgres pg_dump jiecool > backup_$(date +%Y%m%d_%H%M%S).sql

# Nginx 管理
sudo nginx -t                              # 测试配置
sudo nginx -s reload                        # 重新加载配置
sudo systemctl restart nginx                # 重启 Nginx
```

### 数据库维护
```bash
# 连接数据库
sudo -u postgres psql jiecool

# 查看数据库列表
\l

# 查看表结构
\dt

# 退出数据库
\q
```

### 性能优化
```bash
# 调整 PostgreSQL 配置
sudo vim /etc/postgresql/*/main/postgresql.conf

# 关键参数建议:
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100

# 重启 PostgreSQL
sudo systemctl restart postgresql
```

## 故障排除

### 常见问题

#### 1. 后端服务无法启动
```bash
# 检查配置文件
cat /path/to/JieCool/server/manifest/config/config.prod.yaml

# 检查二进制文件
file /path/to/JieCool/server/jiecool-server-prod

# 检查数据库连接
sudo -u postgres psql -h localhost -U jiecool -d jiecool -c "SELECT 1;"

# 查看详细日志
sudo journalctl -u jiecool-backend -n 50
```

#### 2. 前端无法访问
```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查前端服务状态
pm2 status jiecool-frontend
pm2 show jiecool-frontend        # 查看详细信息

# 检查前端是否正常运行
curl http://localhost:53000

# 检查 Next.js 构建文件
ls -la /path/to/JieCool/front-web/.next/

# 检查端口占用
sudo netstat -tlnp | grep 53000

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查前端日志
pm2 logs jiecool-frontend --lines 50
pm2 logs jiecool-frontend --err   # 只看错误日志

# 重启前端服务
pm2 restart jiecool-frontend

# 查看前端进程资源使用
pm2 monit
```

#### 3. 数据库连接失败
```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 检查端口监听
sudo netstat -tlnp | grep 5432

# 测试连接
sudo -u postgres psql -c "SELECT version();"

# 检查用户权限
sudo -u postgres psql -c "\du"
```

#### 4. 端口冲突
```bash
# 查看端口占用
sudo netstat -tlnp | grep -E ":53000|:58080"

# 杀死占用端口的进程
sudo kill -9 <PID>

# 或者修改配置文件中的端口
vim server/manifest/config/config.yaml  # 修改后端端口
# 修改前端端口需要在 front-web/package.json 中修改
```

### 日志文件位置
- **后端日志**: `sudo journalctl -u jiecool-backend`
- **前端日志**: `pm2 logs jiecool-frontend` 或 PM2 日志目录
- **Nginx 日志**: `/var/log/nginx/`
- **PostgreSQL 日志**: `/var/log/postgresql/`
- **应用日志**: `/app/jiecool/JieCool/logs/` (如果配置了文件日志)

### systemd 服务故障排查

如果后端服务无法启动，按以下步骤排查：

#### 1. 检查服务状态和日志
```bash
# 查看服务详细状态
sudo systemctl status jiecool-backend -l

# 查看服务日志
sudo journalctl -u jiecool-backend -n 50

# 实时查看日志
sudo journalctl -u jiecool-backend -f

# 查看系统日志中的相关信息
sudo journalctl -f | grep jiecool-backend
```

#### 2. 验证二进制文件和路径
```bash
# 检查二进制文件是否存在且有执行权限
ls -la /app/jiecool/JieCool/server/main

# 如果没有执行权限，添加权限
sudo chmod +x /app/jiecool/JieCool/server/main

# 手动测试运行（如果成功，说明程序本身没问题）
cd /app/jiecool/JieCool/server
./main
```

#### 3. 检查配置文件权限
```bash
# 检查配置文件权限
ls -la /app/jiecool/JieCool/server/manifest/config/config.yaml

# 确保配置文件可读
sudo chmod 644 /app/jiecool/JieCool/server/manifest/config/config.yaml
```

#### 4. 重新配置服务
如果服务配置有问题，重新创建：

```bash
# 停止并禁用现有服务
sudo systemctl stop jiecool-backend
sudo systemctl disable jiecool-backend

# 删除旧的服务文件
sudo rm -f /etc/systemd/system/jiecool-backend.service

# 重新创建服务文件
sudo vim /etc/systemd/system/jiecool-backend.service

# 重新加载 systemd
sudo systemctl daemon-reload

# 启用并启动服务
sudo systemctl enable jiecool-backend
sudo systemctl start jiecool-backend
```

#### 5. 常见的 NAMESPACE 错误解决
`status=226/NAMESPACE` 错误通常由以下原因引起：

**问题 1: 路径不存在或权限不足**
```bash
# 确认所有路径都存在
sudo mkdir -p /app/jiecool/JieCool/logs
sudo mkdir -p /app/jiecool/JieCool/uploads

# 设置正确的权限
sudo chown -R root:root /app/jiecool/JieCool/
sudo chmod +x /app/jiecool/JieCool/server/main
```

**问题 2: 安全配置过于严格**
如果仍有问题，可以创建一个简化的服务配置：

```ini
[Unit]
Description=JieCool Backend Service
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/app/jiecool/JieCool/server
ExecStart=/app/jiecool/JieCool/server/main
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**问题 3: 环境变量问题**
```bash
# 检查必要的环境变量
printenv | grep -E "(GO|GF|DATABASE)"

# 在服务文件中添加环境变量
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
Environment=GF_GCFG_FILE=config.yaml
```

## 自动化部署脚本

### deploy.sh 脚本使用

项目提供了完整的自动化部署脚本 `deploy.sh`，可以自动完成代码更新、编译和服务重启等操作。

#### 脚本功能
- ✅ **环境检查**：验证 Go、Node.js、PM2 等依赖
- ✅ **代码检测**：自动检测代码变更，无变更时跳过部署
- ✅ **备份管理**：自动备份当前版本，保留最近5个版本
- ✅ **服务管理**：智能停止/启动 systemd 和 PM2 服务
- ✅ **自动编译**：交叉编译后端，构建前端生产版本
- ✅ **健康检查**：验证服务连通性和端口监听状态
- ✅ **日志记录**：完整的部署日志，彩色输出
- ✅ **错误处理**：完善的错误处理和回滚机制

#### 使用方法

```bash
# 标准部署（包含 Git 代码拉取）
./deploy.sh

# 跳过代码更新，仅重新编译和重启（用于本地测试）
./deploy.sh --no-pull

# 显示帮助信息
./deploy.sh --help
# 或
./deploy.sh -h
```

#### 脚本配置

脚本默认配置：
- **项目目录**：`/app/jiecool/JieCool`
- **后端端口**：58080
- **前端端口**：53000
- **备份保留**：最近5个版本
- **日志文件**：`/app/jiecool/JieCool/deploy.log`
- **备份目录**：`/app/jiecool/JieCool/backups`

如需修改配置，请编辑脚本开头的配置变量：
```bash
# 配置变量
PROJECT_DIR="/app/jiecool/JieCool"        # 项目根目录
LOG_FILE="$PROJECT_DIR/deploy.log"         # 部署日志文件
BACKUP_DIR="$PROJECT_DIR/backups"          # 备份目录
```

#### 部署流程

1. **环境检查**：验证 Go、Node.js、PM2、项目目录等
2. **代码更新**：执行 `git pull origin main`（可跳过）
3. **版本备份**：备份后端二进制文件和前端构建文件
4. **服务停止**：停止 jiecool-backend 和 jiecool-frontend 服务
5. **后端编译**：下载依赖并交叉编译为 Linux AMD64
6. **前端构建**：清理缓存并构建生产版本
7. **服务启动**：启动后端和前端服务
8. **健康检查**：测试端口监听和 API 连通性
9. **清理操作**：删除过期备份文件
10. **结果展示**：显示部署摘要和状态信息

#### 日志和监控

```bash
# 查看部署日志
tail -f /app/jiecool/JieCool/deploy.log

# 查看最近的部署历史
grep -E "开始|完成|失败" /app/jiecool/JieCool/deploy.log | tail -10

# 查看备份文件
ls -la /app/jiecool/JieCool/backups/

# 查看服务状态
sudo systemctl status jiecool-backend
pm2 status jiecool-frontend
```

#### 错误排查

如果部署失败，脚本会自动停止并显示错误信息：

1. **查看详细日志**：
   ```bash
   # 查看部署日志
   tail -50 /app/jiecool/JieCool/deploy.log

   # 查看后端服务日志
   sudo journalctl -u jiecool-backend -n 50

   # 查看前端服务日志
   pm2 logs jiecool-frontend --lines 50
   ```

2. **手动恢复**：
   ```bash
   # 恢复最近的后端备份
   cp /app/jiecool/JieCool/backups/main_backup_* /app/jiecool/JieCool/server/main

   # 恢复最近的前端备份
   rm -rf /app/jiecool/JieCool/front-web/.next
   cp -r /app/jiecool/JieCool/backups/frontend_backup_* /app/jiecool/JieCool/front-web/.next

   # 重启服务
   sudo systemctl restart jiecool-backend
   pm2 restart jiecool-frontend
   ```

3. **常见问题解决**：
   - **权限问题**：确保脚本有执行权限 `chmod +x deploy.sh`
   - **Git 冲突**：手动解决代码冲突后重新运行
   - **编译失败**：检查 Go 和 Node.js 环境配置
   - **服务启动失败**：检查 systemd 和 PM2 配置

#### 高级用法

**定时自动部署**：
```bash
# 添加到 crontab，每小时检查一次更新
crontab -e
# 添加行：
0 * * * * cd /app/jiecool/JieCool && ./deploy.sh >> /var/log/jiecool-deploy.log 2>&1
```

**指定分支部署**：
```bash
# 修改脚本中的 git pull 命令
git pull origin dev  # 使用 dev 分支
```

**自定义部署前/后脚本**：
可以在脚本中添加自定义的部署前检查和部署后验证逻辑。

## 手动更新部署

如果需要手动更新而不使用自动脚本，可以按以下步骤操作：

### 更新应用代码
```bash
# 1. 备份当前版本
sudo systemctl stop jiecool-backend
pm2 stop jiecool-frontend
cp -r /path/to/JieCool /path/to/JieCool.backup.$(date +%Y%m%d_%H%M%S)

# 2. 更新代码
cd /path/to/JieCool
git pull origin main

# 3. 重新编译后端 (如果需要)
cd server
go mod tidy
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main .

# 4. 重新构建前端 (如果需要)
cd ../front-web
npm install
npm run build

# 5. 重启服务
sudo systemctl start jiecool-backend
pm2 start jiecool-frontend

# 6. 验证服务状态
sudo systemctl status jiecool-backend
pm2 status jiecool-frontend
```

### 数据库迁移
```bash
# 如果有数据库迁移脚本
cd /path/to/JieCool/server
./main-prod migrate

# 或手动执行 SQL
sudo -u postgres psql jiecool < migration.sql
```

## 环境配置说明

### 前端环境配置
前端使用 Next.js 标准环境配置：

- `.env.development` - 开发环境
- `.env.production` - 生产环境
- `.env.local` - 本地覆盖配置

### 后端配置说明
后端使用 GoFrame 的单配置文件 `server/manifest/config/config.yaml`，部署时需要手动修改以下关键配置：

1. **数据库连接**：修改 `database.default.link` 字段
2. **服务端口**：修改 `server.address` 字段
3. **日志级别**：修改 `logger.level` 字段
4. **Swagger认证**：修改 `swagger.auth` 相关字段

## 安全建议

1. **使用非 root 用户运行应用**
2. **定期更新系统和依赖包**
3. **配置防火墙，只开放必要端口**
4. **定期备份数据库和重要文件**
5. **使用强密码和 SSH 密钥认证**
6. **监控应用和系统日志**
7. **配置 HTTPS 和安全头**

## 联系支持

如果遇到部署问题，请提供以下信息：
- 操作系统版本
- 错误信息
- 相关日志
- 配置文件内容

这样可以更快地定位和解决问题。