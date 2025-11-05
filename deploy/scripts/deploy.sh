#!/bin/bash

# =============================================================================
# JieCool 一键部署脚本
# 版本: v1.0.0
# 平台: CentOS 7/8
# 描述: 自动解压部署包并配置启动服务
# =============================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用 root 用户运行此脚本！"
        log_info "建议创建专用用户: sudo useradd -m -s /bin/bash jiecool"
        exit 1
    fi
}

# 加载配置
load_config() {
    if [[ ! -f "config.env" ]]; then
        log_error "未找到 config.env 配置文件！"
        log_info "请先配置 config.env 文件"
        exit 1
    fi

    log_step "加载配置文件..."
    source config.env

    # 验证必要配置
    if [[ -z "$DB_HOST" || -z "$DB_NAME" || -z "$DB_USER" || -z "$DB_PASSWORD" ]]; then
        log_error "数据库配置不完整！请检查 config.env"
        exit 1
    fi

    log_info "配置加载完成"
}

# 系统环境检查
check_system() {
    log_step "检查系统环境..."

    # 检查操作系统
    if ! command -v systemctl &> /dev/null; then
        log_error "当前系统不支持 systemd！"
        exit 1
    fi

    # 检查网络连接
    if ! ping -c 1 8.8.8.8 &> /dev/null; then
        log_warn "网络连接异常，可能影响依赖安装"
    fi

    # 检查磁盘空间
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    REQUIRED_SPACE=2097152  # 2GB in KB

    if [[ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]]; then
        log_error "磁盘空间不足，至少需要 2GB 可用空间"
        exit 1
    fi

    log_info "系统环境检查通过"
}

# 安装系统依赖
install_dependencies() {
    log_step "检查并安装系统依赖..."

    # 检查 Nginx
    if ! command -v nginx &> /dev/null; then
        log_info "安装 Nginx..."
        if command -v yum &> /dev/null; then
            sudo yum install -y nginx
        elif command -v apt &> /dev/null; then
            sudo apt update && sudo apt install -y nginx
        else
            log_error "不支持的包管理器，请手动安装 Nginx"
            exit 1
        fi
    fi

    # 检查 PostgreSQL 客户端
    if ! command -v psql &> /dev/null; then
        log_info "安装 PostgreSQL 客户端..."
        if command -v yum &> /dev/null; then
            sudo yum install -y postgresql
        elif command -v apt &> /dev/null; then
            sudo apt install -y postgresql-client
        fi
    fi

    # 检查 unzip
    if ! command -v unzip &> /dev/null; then
        log_info "安装 unzip..."
        if command -v yum &> /dev/null; then
            sudo yum install -y unzip
        elif command -v apt &> /dev/null; then
            sudo apt install -y unzip
        fi
    fi

    log_info "系统依赖安装完成"
}

# 创建用户和目录
setup_directories() {
    log_step "设置部署目录和权限..."

    # 创建必要目录
    mkdir -p logs uploads backups

    # 设置文件权限
    chmod +x server/main 2>/dev/null || true
    chmod +x scripts/*.sh

    # 创建日志目录
    sudo mkdir -p /var/log/jiecool
    sudo chown $USER:$USER /var/log/jiecool

    log_info "目录设置完成"
}

# 配置数据库连接
test_database() {
    log_step "测试数据库连接..."

    export PGPASSWORD="$DB_PASSWORD"

    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();" &> /dev/null; then
        log_error "数据库连接失败！"
        log_info "请检查以下配置："
        log_info "  - 数据库服务是否运行"
        log_info "  - 数据库连接参数是否正确"
        log_info "  - 防火墙是否开放数据库端口"
        exit 1
    fi

    log_info "数据库连接成功"
}

# 配置后端
configure_backend() {
    log_step "配置后端服务..."

    # 更新配置文件
    CONFIG_FILE="server/manifest/config/config.yaml"

    if [[ -f "$CONFIG_FILE" ]]; then
        # 备份原配置
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

        # 更新数据库配置
        sed -i "s|link:.*pgsql:.*@tcp.*|link: \"pgsql:$DB_USER:$DB_PASSWORD@tcp($DB_HOST:$DB_PORT)/$DB_NAME\"|g" "$CONFIG_FILE"

        # 更新服务器端口
        sed -i "s|address:.*|address: \":$BACKEND_PORT\"|g" "$CONFIG_FILE"

        log_info "后端配置更新完成"
    else
        log_error "未找到后端配置文件！"
        exit 1
    fi
}

# 配置 Nginx
configure_nginx() {
    log_step "配置 Nginx..."

    # 生成 Nginx 配置
    sudo tee /etc/nginx/sites-available/jiecool > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # 前端静态文件
    location / {
        root $PWD/frontend/out;
        index index.html index.htm;
        try_files \$uri \$uri/ /index.html;

        # 静态资源缓存
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:$BACKEND_PORT/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

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
EOF

    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/jiecool /etc/nginx/sites-enabled/

    # 移除默认站点
    sudo rm -f /etc/nginx/sites-enabled/default

    # 测试配置
    if sudo nginx -t; then
        sudo systemctl reload nginx
        log_info "Nginx 配置完成"
    else
        log_error "Nginx 配置有误！"
        exit 1
    fi
}

# 创建系统服务
create_systemd_service() {
    log_step "创建系统服务..."

    # 创建后端服务
    sudo tee /etc/systemd/system/jiecool-backend.service > /dev/null << EOF
[Unit]
Description=JieCool Backend Service
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$USER
Group=$USER
WorkingDirectory=$PWD
ExecStart=$PWD/server/main
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
ReadWritePaths=$PWD/logs $PWD/uploads

[Install]
WantedBy=multi-user.target
EOF

    # 重新加载 systemd
    sudo systemctl daemon-reload

    # 设置开机自启
    sudo systemctl enable jiecool-backend

    log_info "系统服务创建完成"
}

# 数据库迁移
run_migrations() {
    log_step "执行数据库迁移..."

    # 运行数据库迁移（如果支持）
    if [[ -x "server/main" ]]; then
        cd server
        ./main migrate 2>/dev/null || log_warn "数据库迁移失败或不需要迁移"
        cd ..
    fi

    log_info "数据库迁移完成"
}

# 启动服务
start_services() {
    log_step "启动服务..."

    # 启动后端服务
    sudo systemctl start jiecool-backend

    # 等待服务启动
    sleep 3

    # 检查服务状态
    if sudo systemctl is-active --quiet jiecool-backend; then
        log_info "后端服务启动成功"
    else
        log_error "后端服务启动失败！"
        sudo journalctl -u jiecool-backend --no-pager -n 20
        exit 1
    fi

    # 重启 Nginx
    sudo systemctl restart nginx

    if sudo systemctl is-active --quiet nginx; then
        log_info "Nginx 服务运行正常"
    else
        log_error "Nginx 服务启动失败！"
        exit 1
    fi
}

# 健康检查
health_check() {
    log_step "执行健康检查..."

    # 检查后端 API
    for i in {1..10}; do
        if curl -f -s "http://localhost:$BACKEND_PORT/api/health" &> /dev/null; then
            log_info "后端 API 健康检查通过"
            break
        fi

        if [[ $i -eq 10 ]]; then
            log_error "后端 API 健康检查失败！"
            log_info "请检查服务日志: sudo journalctl -u jiecool-backend -f"
            exit 1
        fi

        log_info "等待后端服务启动... ($i/10)"
        sleep 2
    done

    # 检查前端访问
    if curl -f -s -I "http://localhost" &> /dev/null; then
        log_info "前端访问正常"
    else
        log_warn "前端访问可能有问题，请检查 Nginx 配置"
    fi

    log_info "健康检查完成"
}

# 部署成功信息
show_success_info() {
    log_step "🎉 部署完成！"

    echo ""
    echo "============================================"
    echo "           JieCool 部署成功！"
    echo "============================================"
    echo ""
    echo "访问地址:"
    echo "  前端: http://$DOMAIN"
    echo "  后端 API: http://$DOMAIN/api/"
    echo "  API 文档: http://$DOMAIN/swagger"
    echo ""
    echo "服务管理命令:"
    echo "  查看状态: ./status.sh"
    echo "  启动服务: ./start.sh"
    echo "  停止服务: ./stop.sh"
    echo "  查看日志: ./logs.sh"
    echo ""
    echo "其他命令:"
    echo "  更新部署: ./update.sh"
    echo "  数据备份: ./backup.sh"
    echo ""
    echo "配置文件位置:"
    echo "  环境配置: config.env"
    echo "  后端配置: server/manifest/config/config.yaml"
    echo ""
    echo "日志查看:"
    echo "  系统日志: sudo journalctl -u jiecool-backend -f"
    echo "  应用日志: tail -f logs/app.log"
    echo ""
    echo "重要提醒:"
    echo "  - 请确保防火墙已开放 80 端口"
    echo "  - 建议定期备份数据库"
    echo "  - 生产环境建议配置 HTTPS"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "============================================"
    echo "         JieCool 一键部署工具"
    echo "============================================"
    echo ""

    # 执行部署步骤
    check_root
    load_config
    check_system
    install_dependencies
    setup_directories
    test_database
    configure_backend
    configure_nginx
    create_systemd_service
    run_migrations
    start_services
    health_check
    show_success_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"