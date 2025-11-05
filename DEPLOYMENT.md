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

### 4. 配置应用

#### 创建配置文件
```bash
# 在项目根目录创建 config.env
cat > config.env << EOF
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jiecool
DB_USER=jiecool
DB_PASSWORD=your_secure_password

# 服务器配置
BACKEND_PORT=8080
FRONTEND_PORT=3000
DOMAIN=localhost

# 部署用户配置
DEPLOY_USER=jiecool

# 其他配置
LOG_LEVEL=info
ENABLE_SSL=false
TIMEZONE=Asia/Shanghai
MAX_UPLOAD_SIZE=100MB
BACKUP_RETENTION_DAYS=30
EOF
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

### 6. 构建前端

#### 方式 1: 在服务器上构建
```bash
# 进入前端目录
cd front-web

# 安装依赖
npm install

# 构建生产版本
npm run build

# 验证构建结果
ls -la out/  # 或 ls -la .next/
```

#### 方式 2: 在本地构建后上传
```bash
# 在本地执行
cd front-web
npm run build

# 将构建结果 (out 或 .next 目录) 上传到服务器
```

### 7. 配置后端

```bash
# 进入服务器目录
cd server

# 更新后端配置文件
vim manifest/config/config.yaml

# 关键配置示例:
server:
  address: ":8080"
  dumpRouterMap: false

database:
  default:
    link: "pgsql:jiecool:your_secure_password@tcp(localhost:5432)/jiecool"
    debug: true

logger:
  level: "info"
  stdout: true
```

### 8. 配置 Nginx

```bash
# 创建 Nginx 配置文件
sudo vim /etc/nginx/sites-available/jiecool
```

配置文件内容:
```nginx
server {
    listen 80;
    server_name localhost;

    # 前端静态文件
    location / {
        root /path/to/JieCool/front-web/out;  # 或 .next 目录
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
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

        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # 文件上传大小限制
        client_max_body_size 100M;
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
WorkingDirectory=/path/to/JieCool/server
ExecStart=/path/to/JieCool/server/main
Restart=always
RestartSec=5
Environment=GO_ENV=production
Environment=GIN_MODE=release

# 日志配置
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jiecool-backend

# 安全配置
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/path/to/JieCool/logs /path/to/JieCool/uploads

[Install]
WantedBy=multi-user.target
```

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

# 检查 Nginx 服务
sudo systemctl status nginx

# 检查端口监听
sudo netstat -tlnp | grep -E ":80|:8080|:5432"
```

#### 测试 API
```bash
# 测试健康检查
curl http://localhost:8080/api/health

# 测试前端访问
curl -I http://localhost
```

#### 查看日志
```bash
# 查看后端日志
sudo journalctl -u jiecool-backend -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 域名和 HTTPS 配置

### 配置域名
1. 将域名 A 记录指向服务器 IP
2. 修改 `config.env` 中的 `DOMAIN=your-domain.com`
3. 重新生成 Nginx 配置并重启服务

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
# 服务管理
sudo systemctl start jiecool-backend      # 启动服务
sudo systemctl stop jiecool-backend       # 停止服务
sudo systemctl restart jiecool-backend    # 重启服务
sudo systemctl status jiecool-backend     # 查看状态

# 日志查看
sudo journalctl -u jiecool-backend -f     # 查看实时日志
sudo journalctl -u jiecool-backend -n 100 # 查看最近100行

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
cat /path/to/JieCool/server/manifest/config/config.yaml

# 检查二进制文件
file /path/to/JieCool/server/main

# 检查数据库连接
sudo -u postgres psql -h localhost -U jiecool -d jiecool -c "SELECT 1;"

# 查看详细日志
sudo journalctl -u jiecool-backend -n 50
```

#### 2. 前端无法访问
```bash
# 检查 Nginx 配置
sudo nginx -t

# 检查前端文件
ls -la /path/to/JieCool/front-web/out/

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log
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
sudo netstat -tlnp | grep 8080

# 杀死占用端口的进程
sudo kill -9 <PID>

# 或者修改配置文件中的端口
vim config.env
```

### 日志文件位置
- **后端日志**: `sudo journalctl -u jiecool-backend`
- **Nginx 日志**: `/var/log/nginx/`
- **PostgreSQL 日志**: `/var/log/postgresql/`
- **应用日志**: `/path/to/JieCool/logs/` (如果配置了文件日志)

## 更新部署

### 更新应用代码
```bash
# 1. 备份当前版本
sudo systemctl stop jiecool-backend
cp -r /path/to/JieCool /path/to/JieCool.backup.$(date +%Y%m%d_%H%M%S)

# 2. 更新代码
cd /path/to/JieCool
git pull origin main

# 3. 重新编译 (如果需要)
cd server
go mod tidy
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o main .

# 4. 重新构建前端 (如果需要)
cd ../front-web
npm install
npm run build

# 5. 重启服务
sudo systemctl start jiecool-backend
sudo systemctl status jiecool-backend
```

### 数据库迁移
```bash
# 如果有数据库迁移脚本
cd /path/to/JieCool/server
./main migrate

# 或手动执行 SQL
sudo -u postgres psql jiecool < migration.sql
```

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