# JieCool Windows 构建 + Linux 部署指南

本文档详细介绍如何在 Windows 环境下构建 JieCool 项目，然后部署到 Linux 服务器上运行。

## 目录

- [环境要求](#环境要求)
- [Windows 开发环境准备](#windows-开发环境准备)
- [项目构建](#项目构建)
- [Linux 服务器准备](#linux-服务器准备)
- [文件上传和部署](#文件上传和部署)
- [服务器配置](#服务器配置)
- [进程管理](#进程管理)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 环境要求

### Windows 开发环境
- **操作系统**：Windows 10/11
- **Git**：最新版本
- **Go**：1.23.0+
- **Node.js**：18.0.0+
- **VS Code**：推荐（可选）

### Linux 服务器环境
- **操作系统**：Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **架构**：x86_64（与 Windows 构建环境一致）
- **内存**：最低 2GB，推荐 4GB+
- **存储**：最低 20GB 可用空间

## Windows 开发环境准备

### 1. 安装 Git

从 [Git 官网](https://git-scm.com/download/win) 下载并安装 Git for Windows。

验证安装：
```cmd
git --version
```

### 2. 安装 Go

1. 访问 [Go 官网](https://golang.org/dl/)
2. 下载适用于 Windows 的安装包
3. 运行安装程序，按默认设置安装

验证安装：
```cmd
go version
```

### 3. 安装 Node.js

1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 20.x）
3. 运行安装程序，按默认设置安装

验证安装：
```cmd
node --version
npm --version
```

### 4. 克隆项目

```cmd
# 克隆项目到本地
git clone https://github.com/your-username/JieCool.git
cd JieCool

# 或者从你的开发仓库
git clone <your-repository-url>
cd JieCool
```

## 项目构建

### 1. 配置后端

```cmd
# 进入后端目录
cd server

# 安装 GoFrame CLI
go install github.com/gogf/gf/v2/cmd/gf@latest

# 复制配置文件
copy manifest\config\config.yaml.example manifest\config\config.yaml

# 编辑配置文件（用记事本或 VS Code）
notepad manifest\config\config.yaml
```

配置文件示例：
```yaml
# 数据库配置
database:
  default:
    link: "pgsql:jiecool_user:your_secure_password@tcp(your-server-ip:5432)/JieCool"
    debug: false

# 服务器配置
server:
  address: ":8080"
  openapiPath: "/api.json"
  swaggerPath: "/swagger"
  # 静态文件服务配置
  staticPaths:
    - path: "/uploads"
      directory: "public/uploads"
      listDirectory: false

# 日志配置
logger:
  level: "info"
  stdout: true
  path: "./logs"

# 注意：JWT和文件上传配置通过动态配置系统管理
# JWT密钥在系统初始化时设置，可通过动态配置修改
# 文件上传大小限制通过动态配置的 max_file_upload_size_mb 等字段控制
```

### 2. 构建后端

```cmd
# 生成代码（如果需要）
gf gen dao
gf gen ctrl

# 交叉编译为 Linux 二进制文件
SET GOOS=linux
SET GOARCH=amd64
SET CGO_ENABLED=0
gf build

# 验证生成的二进制文件
dir main
```

**构建参数说明**：
- `GOOS=linux`：目标操作系统为 Linux
- `GOARCH=amd64`：目标架构为 64 位 x86
- `CGO_ENABLED=0`：禁用 CGO，生成静态二进制文件

### 3. 构建前端

```cmd
# 进入前端目录
cd ..\front-web

# 安装依赖
npm install

# 配置环境变量
copy .env.example .env.production
notepad .env.production
```

生产环境配置示例：
```env
# API 配置
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api

# 其他配置
NEXT_PUBLIC_SITE_NAME=JieCool
```

```cmd
# 构建生产版本
npm run build

# 验证构建结果
dir out
```

### 4. 准备部署文件

创建部署目录结构：
```cmd
# 在项目根目录创建部署目录
mkdir deployment

# 复制后端文件
copy server\main.exe deployment\
copy server\manifest deployment\ /E
mkdir deployment\logs
mkdir deployment\uploads

# 复制前端文件
xcopy front-web\out deployment\frontend /E /I

# 创建部署脚本
echo @echo off > deployment\deploy.bat
echo echo Deploying JieCool to Linux Server... >> deployment\deploy.bat
echo. >> deployment\deploy.bat
echo echo 1. Upload deployment folder to server >> deployment\deploy.bat
echo echo 2. Run setup script on server >> deployment\deploy.bat
echo echo 3. Start services >> deployment\deploy.bat
echo pause >> deployment\deploy.bat
```

## Linux 服务器准备

### 1. 系统更新和基础软件

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget unzip htop nginx postgresql-18

# CentOS/RHEL
sudo yum update -y
sudo yum install -y curl wget unzip htop nginx postgresql18-server postgresql18
```

### 2. 安装 PostgreSQL 18

```bash
# Ubuntu/Debian
wget -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list
sudo apt update
sudo apt install -y postgresql-18 postgresql-client-18

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3. 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 在 PostgreSQL 命令行中执行
CREATE DATABASE JieCool;
CREATE USER jiecool_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE JieCool TO jiecool_user;
ALTER USER jiecool_user CREATEDB;
\q
```

### 4. 配置 PostgreSQL

```bash
# 编辑配置文件
sudo vim /etc/postgresql/18/main/postgresql.conf

# 修改配置
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB

# 编辑访问控制
sudo vim /etc/postgresql/18/main/pg_hca.conf

# 添加行
local   JieCool   jiecool_user                     md5
host    JieCool   jiecool_user   127.0.0.1/32      md5

# 重启服务
sudo systemctl restart postgresql
```

## 文件上传和部署

### 1. 上传构建文件

**方法一：使用 SCP（推荐）**
```cmd
# 在 Windows PowerShell 中执行
scp -r D:\Code\JieCool\deployment\* jiecool@your-server-ip:/home/jiecool/
```

**方法二：使用 FTP/SFTP**
- 使用 FileZilla 或 WinSCP
- 上传整个 deployment 文件夹到服务器

**方法三：使用 rsync**
```cmd
# 先安装 rsync（如果没有）
# 在服务器上执行：
sudo apt install rsync

# 在 Windows 上（需要 WSL 或 Git Bash）
rsync -avz --progress deployment/ jiecool@your-server-ip:/home/jiecool/
```

### 2. 在服务器上设置权限

```bash
# 创建部署用户（如果没有）
sudo useradd -m -s /bin/bash jiecool
sudo usermod -aG sudo jiecool

# 设置文件权限
sudo chown -R jiecool:jiecool /home/jiecool/
chmod +x /home/jiecool/main
chmod +x /home/jiecool/setup.sh
```

### 3. 创建服务器设置脚本

在服务器上创建 `/home/jiecool/setup.sh`：
```bash
#!/bin/bash

echo "Setting up JieCool deployment..."

# 创建必要目录
mkdir -p logs uploads

# 配置后端配置文件
if [ ! -f "manifest/config/config.yaml" ]; then
    echo "Error: config.yaml not found!"
    exit 1
fi

# 配置 Nginx
sudo tee /etc/nginx/sites-available/jiecool > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 前端静态文件
    location / {
        root /home/jiecool/frontend;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 100M;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/jiecool /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 创建 systemd 服务
sudo tee /etc/systemd/system/jiecool-backend.service > /dev/null << 'EOF'
[Unit]
Description=JieCool Backend
After=network.target postgresql.service

[Service]
Type=simple
User=jiecool
WorkingDirectory=/home/jiecool
ExecStart=/home/jiecool/main
Restart=always
RestartSec=5
Environment=GO_ENV=production

StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd
sudo systemctl daemon-reload

# 设置开机自启
sudo systemctl enable jiecool-backend

echo "Setup completed!"
echo "Run: sudo systemctl start jiecool-backend to start the backend service"
```

## 服务器配置

### 1. 配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 配置 SSL 证书（可选）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 进程管理

### 1. 启动服务

```bash
# 启动后端服务
sudo systemctl start jiecool-backend

# 查看服务状态
sudo systemctl status jiecool-backend

# 查看日志
sudo journalctl -u jiecool-backend -f
```

### 2. 验证部署

```bash
# 检查后端 API
curl http://localhost:8080/api/health

# 检查前端
curl -I http://localhost

# 检查数据库连接
psql -h localhost -U jiecool_user -d JieCool -c "SELECT version();"
```

### 3. 数据库迁移

```bash
# 如果需要运行数据库迁移
cd /home/jiecool
./main migrate
```

## 监控和维护

### 1. 日志管理

```bash
# 查看应用日志
tail -f /home/jiecool/logs/app.log

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统日志
sudo journalctl -u jiecool-backend -f
```

### 2. 备份脚本

创建备份脚本 `/home/jiecool/backup.sh`：
```bash
#!/bin/bash

BACKUP_DIR="/home/jiecool/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h localhost -U jiecool_user -d JieCool > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 备份配置文件
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz manifest/

# 删除7天前的备份
find $BACKUP_DIR -name "*backup_*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

设置定时备份：
```bash
chmod +x /home/jiecool/backup.sh
sudo crontab -e
# 添加：0 2 * * * /home/jiecool/backup.sh >> /home/jiecool/backup.log 2>&1
```

### 3. 更新流程

```bash
# 1. 停止服务
sudo systemctl stop jiecool-backend

# 2. 备份当前版本
cp main main.backup.$(date +%Y%m%d)

# 3. 上传新文件（从 Windows）
# 在 Windows PowerShell 中执行：
scp -r deployment\* jiecool@your-server-ip:/home/jiecool/update/

# 4. 在服务器上更新
cd /home/jiecool/update
cp -r * ../
sudo chown -R jiecool:jiecool /home/jiecool/
chmod +x main

# 5. 运行数据库迁移（如需要）
./main migrate

# 6. 重启服务
sudo systemctl start jiecool-backend

# 7. 验证更新
curl http://localhost:8080/api/health
```

## 故障排除

### 常见问题

1. **后端无法启动**
   ```bash
   # 检查权限
   ls -la main

   # 检查配置文件
   ./main -c manifest/config/config.yaml -check

   # 查看详细错误
   ./main
   ```

2. **前端 404 错误**
   ```bash
   # 检查文件权限
   ls -la /home/jiecool/frontend/

   # 检查 Nginx 配置
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **数据库连接失败**
   ```bash
   # 检查 PostgreSQL 状态
   sudo systemctl status postgresql

   # 测试连接
   psql -h localhost -U jiecool_user -d JieCool
   ```

4. **权限问题**
   ```bash
   # 重新设置权限
   sudo chown -R jiecool:jiecool /home/jiecool/
   chmod +x /home/jiecool/main
   ```

### 性能监控

```bash
# 查看系统资源
htop

# 查看端口占用
sudo netstat -tlnp | grep :8080

# 查看磁盘空间
df -h

# 查看内存使用
free -h
```

## Windows 构建优化技巧

### 1. 使用批处理脚本自动化

创建 `build-deploy.bat`：
```batch
@echo off
echo ========================================
echo JieCool Windows Build Script
echo ========================================

echo.
echo 1. Building Backend...
cd server
SET GOOS=linux
SET GOARCH=amd64
SET CGO_ENABLED=0
gf build
if %ERRORLEVEL% NEQ 0 (
    echo Backend build failed!
    pause
    exit /b 1
)
echo Backend build successful!

echo.
echo 2. Building Frontend...
cd ..\front-web
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)
echo Frontend build successful!

echo.
echo 3. Preparing deployment files...
cd ..
if not exist deployment mkdir deployment
xcopy server\main.exe deployment\ /Y
xcopy server\manifest deployment\ /E /I /Y
xcopy front-web\out deployment\frontend\ /E /I /Y
mkdir deployment\logs
mkdir deployment\uploads

echo.
echo Build completed successfully!
echo Files are ready in 'deployment' folder.
echo.
echo Next steps:
echo 1. Upload deployment folder to Linux server
echo 2. Run setup script on server
echo 3. Start services
echo.
pause
```

### 2. 使用 PowerShell 脚本

创建 `build-deploy.ps1`：
```powershell
# JieCool Build and Deploy Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "JieCool Windows Build Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    Write-Host "`n1. Building Backend..." -ForegroundColor Yellow
    Set-Location server
    $env:GOOS = "linux"
    $env:GOARCH = "amd64"
    $env:CGO_ENABLED = "0"
    & gf build
    if ($LASTEXITCODE -ne 0) {
        throw "Backend build failed!"
    }
    Write-Host "Backend build successful!" -ForegroundColor Green

    Write-Host "`n2. Building Frontend..." -ForegroundColor Yellow
    Set-Location ..\front-web
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed!"
    }
    Write-Host "Frontend build successful!" -ForegroundColor Green

    Write-Host "`n3. Preparing deployment files..." -ForegroundColor Yellow
    Set-Location ..
    if (!(Test-Path "deployment")) {
        New-Item -ItemType Directory -Path "deployment"
    }

    Copy-Item "server\main.exe" "deployment\" -Force
    Copy-Item "server\manifest" "deployment\" -Recurse -Force
    Copy-Item "front-web\out" "deployment\frontend" -Recurse -Force

    if (!(Test-Path "deployment\logs")) {
        New-Item -ItemType Directory -Path "deployment\logs"
    }
    if (!(Test-Path "deployment\uploads")) {
        New-Item -ItemType Directory -Path "deployment\uploads"
    }

    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    Write-Host "Files are ready in 'deployment' folder.` -ForegroundColor Cyan

    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Upload deployment folder to Linux server" -ForegroundColor White
    Write-Host "2. Run setup script on server" -ForegroundColor White
    Write-Host "3. Start services" -ForegroundColor White

} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

### 3. 使用 Git Bash 或 WSL

如果你有 WSL（Windows Subsystem for Linux），也可以直接在 WSL 中构建：

```bash
# 在 WSL 中执行
cd /mnt/d/Code/JieCool
./build-deploy.sh
```

---

## 联系信息

如果在部署过程中遇到问题，请参考：
- 项目 GitHub 仓库
- GoFrame 官方文档：https://goframe.org/
- Next.js 官方文档：https://nextjs.org/docs
- PostgreSQL 官方文档：https://www.postgresql.org/docs/

**特别说明**：本文档针对 Windows 开发环境 + Linux 生产环境的混合部署场景，提供了完整的构建、上传、部署流程。