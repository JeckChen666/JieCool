#!/bin/bash

# =============================================================================
# JieCool 服务启动脚本
# 版本: v1.0.0
# 描述: 启动 JieCool 后端服务和相关组件
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 检查权限
check_permissions() {
    if ! sudo -n true 2>/dev/null; then
        log_warn "需要 sudo 权限来管理系统服务"
    fi
}

# 检查服务状态
check_service_status() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        return 0
    else
        return 1
    fi
}

# 启动后端服务
start_backend() {
    log_step "启动后端服务..."

    # 检查二进制文件
    if [[ ! -x "server/main" ]]; then
        log_error "后端二进制文件不存在或不可执行: server/main"
        exit 1
    fi

    # 检查配置文件
    if [[ ! -f "server/manifest/config/config.yaml" ]]; then
        log_error "后端配置文件不存在: server/manifest/config/config.yaml"
        exit 1
    fi

    # 启动服务
    if sudo systemctl start jiecool-backend; then
        log_info "后端服务启动成功"
    else
        log_error "后端服务启动失败"
        sudo journalctl -u jiecool-backend --no-pager -n 20
        exit 1
    fi

    # 等待服务启动
    sleep 3

    # 验证服务状态
    if check_service_status jiecool-backend; then
        log_info "后端服务运行正常"
    else
        log_error "后端服务启动后状态异常"
        exit 1
    fi
}

# 启动 Nginx
start_nginx() {
    log_step "启动 Nginx 服务..."

    if sudo systemctl start nginx; then
        log_info "Nginx 服务启动成功"
    else
        log_error "Nginx 服务启动失败"
        sudo journalctl -u nginx --no-pager -n 10
        exit 1
    fi

    # 验证 Nginx 状态
    if check_service_status nginx; then
        log_info "Nginx 服务运行正常"
    else
        log_error "Nginx 服务启动后状态异常"
        exit 1
    fi
}

# 检查端口占用
check_ports() {
    log_step "检查端口占用情况..."

    # 检查后端端口
    if netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
        log_info "后端端口 8080 正常监听"
    else
        log_warn "后端端口 8080 未监听，可能服务启动失败"
    fi

    # 检查 HTTP 端口
    if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
        log_info "HTTP 端口 80 正常监听"
    else
        log_warn "HTTP 端口 80 未监听，Nginx 可能有问题"
    fi
}

# 健康检查
health_check() {
    log_step "执行健康检查..."

    # 检查后端 API
    local max_attempts=10
    local attempt=1

    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:8080/api/health" &> /dev/null; then
            log_info "后端 API 健康检查通过"
            break
        fi

        if [[ $attempt -eq $max_attempts ]]; then
            log_error "后端 API 健康检查失败！"
            log_info "请检查服务日志: sudo journalctl -u jiecool-backend -f"
            return 1
        fi

        log_info "等待后端服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done

    # 检查前端访问
    if curl -f -s -I "http://localhost" &> /dev/null; then
        log_info "前端访问正常"
    else
        log_warn "前端访问可能有问题，请检查 Nginx 配置"
    fi
}

# 显示启动信息
show_startup_info() {
    log_step "🎉 服务启动完成！"

    echo ""
    echo "============================================"
    echo "           JieCool 服务状态"
    echo "============================================"
    echo ""

    # 显示服务状态
    echo "服务状态:"
    if check_service_status jiecool-backend; then
        echo "  ✅ 后端服务: 运行中 (PID: $(systemctl show jiecool-backend -p MainPID --value))"
    else
        echo "  ❌ 后端服务: 未运行"
    fi

    if check_service_status nginx; then
        echo "  ✅ Nginx: 运行中"
    else
        echo "  ❌ Nginx: 未运行"
    fi

    echo ""
    echo "访问地址:"
    echo "  前端: http://localhost"
    echo "  后端 API: http://localhost:8080/api/"
    echo "  API 文档: http://localhost:8080/swagger"
    echo ""

    echo "管理命令:"
    echo "  查看状态: ./status.sh"
    echo "  停止服务: ./stop.sh"
    echo "  重启服务: ./restart.sh"
    echo "  查看日志: ./logs.sh"
    echo ""

    echo "系统日志:"
    echo "  后端日志: sudo journalctl -u jiecool-backend -f"
    echo "  Nginx 日志: sudo journalctl -u nginx -f"
    echo "  应用日志: tail -f logs/app.log"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "============================================"
    echo "         JieCool 服务启动工具"
    echo "============================================"
    echo ""

    # 执行启动步骤
    check_permissions
    start_backend
    start_nginx
    check_ports
    health_check
    show_startup_info
}

# 错误处理
trap 'log_error "启动过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"