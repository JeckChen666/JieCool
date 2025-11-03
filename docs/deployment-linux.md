# JieCool Linux 服务器部署指南

本文档详细介绍如何将 JieCool 项目部署到 Linux 服务器上。

## 目录

- [环境要求](#环境要求)
- [服务器准备](#服务器准备)
- [数据库配置](#数据库配置)
- [后端部署](#后端部署)
- [前端部署](#前端部署)
- [反向代理配置](#反向代理配置)
- [SSL 证书配置](#ssl-证书配置)
- [进程管理](#进程管理)
- [监控和日志](#监控和日志)
- [维护和更新](#维护和更新)

## 环境要求

### 系统要求
- **操作系统**：Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **架构**：x86_64 或 ARM64
- **内存**：最低 2GB，推荐 4GB+
- **存储**：最低 20GB 可用空间
- **网络**：稳定的互联网连接

### 软件依赖
- **Go**：1.23.0+
- **Node.js**：18.0.0+
- **PostgreSQL**：18+
- **Nginx**：1.18+（可选，用于反向代理）
- **PM2**：最新版本（进程管理）

## 服务器准备

### 1. 系统更新

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 2. 安装必要工具

```bash
# Ubuntu/Debian
sudo apt install -y git curl wget vim htop unzip

# CentOS/RHEL
sudo yum install -y git curl wget vim htop unzip
```

### 3. 创建部署用户（推荐）

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash jiecool
sudo usermod -aG sudo jiecool

# 切换到部署用户
sudo su - jiecool
```

### 4. 防火墙配置

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

## 数据库配置

### 1. 安装 PostgreSQL 18

```bash
# 添加官方仓库
wget -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" | sudo tee /etc/apt/sources.list.d/pgdg.list

# 安装 PostgreSQL
sudo apt update
sudo apt install -y postgresql-18 postgresql-client-18

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建数据库和用户

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

### 3. 配置 PostgreSQL

```bash
# 编辑配置文件
sudo vim /etc/postgresql/18/main/postgresql.conf

# 修改以下配置
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB

# 编辑访问控制
sudo vim /etc/postgresql/18/main/pg_hba.conf

# 添加以下行
local   JieCool   jiecool_user                     md5
host    JieCool   jiecool_user   127.0.0.1/32      md5

# 重启服务
sudo systemctl restart postgresql
```

## 后端部署

### 1. 安装 Go

```bash
# 下载并安装 Go 1.23
cd /tmp
wget https://golang.org/dl/go1.23.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.0.linux-amd64.tar.gz

# 配置环境变量
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export GOROOT=/usr/local/go' >> ~/.bashrc
source ~/.bashrc

# 验证安装
go version
```

### 2. 获取源代码

```bash
# 克隆项目
cd /home/jiecool
git clone https://github.com/your-username/JieCool.git
cd JieCool

# 或使用上传的代码包
# scp -r ./JieCool jiecool@your-server:/home/jiecool/
```

### 3. 配置后端

```bash
cd server

# 复制配置文件
cp manifest/config/config.yaml.example manifest/config/config.yaml

# 编辑配置文件
vim manifest/config/config.yaml
```

配置文件示例：
```yaml
# 数据库配置
database:
  default:
    link: "pgsql:jiecool_user:your_secure_password@tcp(127.0.0.1:5432)/JieCool"
    debug: false

# 服务器配置
server:
  address: ":8080"
  dumpRouterMap: false

# 日志配置
logger:
  level: "info"
  stdout: true
  path: "./logs"

# JWT 配置
jwt:
  secret: "your-jwt-secret-key"
  expire: 86400

# 文件上传配置
upload:
  path: "./uploads"
  maxSize: 100MB
  allowedTypes: ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx", "txt", "zip"]
```

### 4. 编译和运行

```bash
# 安装 GoFrame CLI
go install github.com/gogf/gf/v2/cmd/gf@latest

# 生成代码（如果需要）
gf gen dao
gf gen ctrl

# 编译项目
gf build

# 创建必要目录
mkdir -p logs uploads

# 测试运行
./main
```

### 5. 数据库迁移

```bash
# 运行数据库迁移
./main migrate

# 或使用 GoFrame 命令
gf run main.go migrate
```

## 前端部署

### 1. 安装 Node.js

```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 构建前端

```bash
cd /home/jiecool/JieCool/front-web

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.production
vim .env.production
```

生产环境配置示例：
```env
# API 配置
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api

# 其他配置
NEXT_PUBLIC_SITE_NAME=JieCool
```

```bash
# 构建生产版本
npm run build

# 导出静态文件（可选）
npm run export
```

### 3. 使用 Nginx 托管前端

```bash
# 创建前端目录
sudo mkdir -p /var/www/jiecool

# 复制构建文件
sudo cp -r out/* /var/www/jiecool/
sudo chown -R www-data:www-data /var/www/jiecool
sudo chmod -R 755 /var/www/jiecool
```

## 反向代理配置

### 1. 安装 Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 配置 Nginx

创建 Nginx 配置文件：
```bash
sudo vim /etc/nginx/sites-available/jiecool
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/jiecool;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;

        # 缓存配置
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

        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传大小限制
    client_max_body_size 100M;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/jiecool /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL 证书配置

### 1. 使用 Let's Encrypt（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 手动配置 SSL（可选）

如果已有 SSL 证书，手动配置：
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 其他配置...
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 进程管理

### 1. 使用 systemd 管理后端

创建 systemd 服务文件：
```bash
sudo vim /etc/systemd/system/jiecool-backend.service
```

```ini
[Unit]
Description=JieCool Backend
After=network.target postgresql.service

[Service]
Type=simple
User=jiecool
WorkingDirectory=/home/jiecool/JieCool/server
ExecStart=/home/jiecool/JieCool/server/main
Restart=always
RestartSec=5
Environment=GO_ENV=production

# 日志
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl daemon-reload
sudo systemctl start jiecool-backend
sudo systemctl enable jiecool-backend
```

### 2. 使用 PM2 管理前端（可选）

```bash
# 安装 PM2
sudo npm install -g pm2

# 创建 PM2 配置文件
cd /home/jiecool/JieCool/front-web
vim ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'jiecool-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/home/jiecool/JieCool/front-web',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
```

启动应用：
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 监控和日志

### 1. 日志管理

```bash
# 查看后端日志
sudo journalctl -u jiecool-backend -f

# 查看应用日志
tail -f /home/jiecool/JieCool/server/logs/app.log

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 系统监控

安装监控工具：
```bash
# 安装 htop
sudo apt install -y htop

# 安装 iotop
sudo apt install -y iotop

# 安装 netstat
sudo apt install -y net-tools
```

### 3. 健康检查

创建健康检查脚本：
```bash
vim /home/jiecool/health_check.sh
```

```bash
#!/bin/bash

# 检查后端服务
if ! curl -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "$(date): Backend service is down, restarting..."
    sudo systemctl restart jiecool-backend
fi

# 检查数据库连接
if ! pg_isready -h localhost -p 5432 -U jiecool_user > /dev/null 2>&1; then
    echo "$(date): PostgreSQL is down"
    sudo systemctl restart postgresql
fi

# 检查磁盘空间
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "$(date): Disk usage is ${DISK_USAGE}%"
fi
```

设置定时检查：
```bash
chmod +x /home/jiecool/health_check.sh
sudo crontab -e
# 添加以下行（每5分钟检查一次）
*/5 * * * * /home/jiecool/health_check.sh >> /home/jiecool/health_check.log 2>&1
```

## 维护和更新

### 1. 备份策略

数据库备份脚本：
```bash
vim /home/jiecool/backup_db.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/jiecool/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="JieCool"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
pg_dump -h localhost -U jiecool_user -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Database backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

设置定时备份：
```bash
chmod +x /home/jiecool/backup_db.sh
sudo crontab -e
# 添加以下行（每天凌晨2点备份）
0 2 * * * /home/jiecool/backup_db.sh >> /home/jiecool/backup.log 2>&1
```

### 2. 更新流程

```bash
# 1. 备份当前版本
cd /home/jiecool/JieCool
git checkout main
git tag backup-$(date +%Y%m%d-%H%M%S)

# 2. 拉取最新代码
git fetch origin
git pull origin main

# 3. 更新后端
cd server
git pull origin main
gf build
sudo systemctl restart jiecool-backend

# 4. 更新前端
cd ../front-web
git pull origin main
npm install
npm run build
sudo cp -r out/* /var/www/jiecool/

# 5. 数据库迁移（如需要）
cd ../server
./main migrate

# 6. 验证服务
curl -f http://localhost:8080/api/health
```

### 3. 回滚流程

```bash
# 回滚到上一个版本
cd /home/jiecool/JieCool
git checkout backup-YYYYMMDD-HHMMSS

# 重新编译和部署
cd server
gf build
sudo systemctl restart jiecool-backend

cd ../front-web
npm install
npm run build
sudo cp -r out/* /var/www/jiecool/
```

## 故障排除

### 常见问题

1. **后端无法启动**
   ```bash
   # 检查日志
   sudo journalctl -u jiecool-backend -n 50

   # 检查配置文件
   ./main -c manifest/config/config.yaml -check
   ```

2. **数据库连接失败**
   ```bash
   # 检查 PostgreSQL 状态
   sudo systemctl status postgresql

   # 测试连接
   psql -h localhost -U jiecool_user -d JieCool
   ```

3. **前端页面 404**
   ```bash
   # 检查 Nginx 配置
   sudo nginx -t

   # 重新加载 Nginx
   sudo systemctl reload nginx

   # 检查文件权限
   ls -la /var/www/jiecool/
   ```

4. **SSL 证书问题**
   ```bash
   # 检查证书状态
   sudo certbot certificates

   # 手动续期
   sudo certbot renew
   ```

### 性能优化

1. **数据库优化**
   ```sql
   -- 查看慢查询
   SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

   -- 创建索引
   CREATE INDEX CONCURRENTLY idx_files_created_at ON files(created_at);
   ```

2. **Nginx 优化**
   ```nginx
   # 启用 gzip 压缩
   gzip on;
   gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

   # 启用缓存
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## 安全建议

1. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **配置防火墙**
   ```bash
   sudo ufw enable
   sudo ufw status
   ```

3. **使用强密码和密钥认证**
   ```bash
   # 禁用密码登录，仅使用密钥
   sudo vim /etc/ssh/sshd_config
   # PasswordAuthentication no
   sudo systemctl restart ssh
   ```

4. **定期备份数据**
   ```bash
   # 确保备份脚本正常运行
   sudo crontab -l
   ```

5. **监控异常活动**
   ```bash
   # 监控登录日志
   sudo tail -f /var/log/auth.log
   ```

---

## 联系信息

如果在部署过程中遇到问题，请参考：
- 项目 GitHub 仓库
- GoFrame 官方文档：https://goframe.org/
- Next.js 官方文档：https://nextjs.org/docs
- PostgreSQL 官方文档：https://www.postgresql.org/docs/