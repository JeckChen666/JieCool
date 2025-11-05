#!/bin/bash

# =============================================================================
# JieCool 服务停止脚本
# 版本: v1.0.0
# 描述: 停止 JieCool 后端服务和相关组件
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

# 停止后端服务
stop_backend() {
    log_step "停止后端服务..."

    if check_service_status jiecool-backend; then
        if sudo systemctl stop jiecool-backend; then
            log_info "后端服务已停止"
        else
            log_error "后端服务停止失败"
            exit 1
        fi
    else
        log_info "后端服务未运行"
    fi

    # 等待服务完全停止
    sleep 2

    # 验证服务状态
    if check_service_status jiecool-backend; then
        log_error "后端服务仍在运行，停止失败"
        exit 1
    else
        log_info "后端服务已完全停止"
    fi
}

# 停止 Nginx
stop_nginx() {
    log_step "停止 Nginx 服务..."

    if check_service_status nginx; then
        if sudo systemctl stop nginx; then
            log_info "Nginx 服务已停止"
        else
            log_error "Nginx 服务停止失败"
            exit 1
        fi
    else
        log_info "Nginx 服务未运行"
    fi

    # 等待服务完全停止
    sleep 1

    # 验证服务状态
    if check_service_status nginx; then
        log_error "Nginx 服务仍在运行，停止失败"
        exit 1
    else
        log_info "Nginx 服务已完全停止"
    fi
}

# 强制停止进程
force_stop_processes() {
    log_step "检查并强制停止残留进程..."

    # 检查后端进程
    local backend_pids=$(pgrep -f "server/main" 2>/dev/null || true)
    if [[ -n "$backend_pids" ]]; then
        log_warn "发现残留的后端进程，正在强制停止..."
        echo "$backend_pids" | xargs sudo kill -TERM 2>/dev/null || true
        sleep 2

        # 如果仍在运行，强制杀死
        backend_pids=$(pgrep -f "server/main" 2>/dev/null || true)
        if [[ -n "$backend_pids" ]]; then
            log_warn "强制杀死残留进程..."
            echo "$backend_pids" | xargs sudo kill -KILL 2>/dev/null || true
        fi
    fi

    # 检查端口占用
    local port_8080=$(sudo netstat -tlnp 2>/dev/null | grep ":8080 " || true)
    local port_80=$(sudo netstat -tlnp 2>/dev/null | grep ":80 " || true)

    if [[ -n "$port_8080" ]]; then
        log_warn "端口 8080 仍被占用，请检查进程"
    fi

    if [[ -n "$port_80" ]]; then
        log_warn "端口 80 仍被占用，可能有其他 Web 服务运行"
    fi
}

# 清理临时文件
cleanup_temp_files() {
    log_step "清理临时文件..."

    # 清理临时上传文件
    if [[ -d "uploads/tmp" ]]; then
        rm -rf uploads/tmp/* 2>/dev/null || true
        log_info "临时上传文件已清理"
    fi

    # 清理日志文件（可选）
    if [[ -f "logs/app.log" ]] && [[ $(stat -c%s "logs/app.log" 2>/dev/null || echo 0) -gt 104857600 ]]; then
        # 如果日志文件大于 100MB，进行轮转
        mv logs/app.log logs/app.log.$(date +%Y%m%d_%H%M%S).old 2>/dev/null || true
        log_info "日志文件已轮转"
    fi
}

# 显示停止信息
show_stop_info() {
    log_step "🛑 服务停止完成！"

    echo ""
    echo "============================================"
    echo "           JieCool 服务状态"
    echo "============================================"
    echo ""

    # 显示服务状态
    echo "服务状态:"
    if check_service_status jiecool-backend; then
        echo "  ❌ 后端服务: 仍在运行"
    else
        echo "  ✅ 后端服务: 已停止"
    fi

    if check_service_status nginx; then
        echo "  ❌ Nginx: 仍在运行"
    else
        echo "  ✅ Nginx: 已停止"
    fi

    echo ""
    echo "端口状态:"
    if sudo netstat -tlnp 2>/dev/null | grep -q ":8080 "; then
        echo "  ⚠️  端口 8080: 仍被占用"
    else
        echo "  ✅ 端口 8080: 已释放"
    fi

    if sudo netstat -tlnp 2>/dev/null | grep -q ":80 "; then
        echo "  ⚠️  端口 80: 仍被占用"
    else
        echo "  ✅ 端口 80: 已释放"
    fi

    echo ""
    echo "管理命令:"
    echo "  启动服务: ./start.sh"
    echo "  查看状态: ./status.sh"
    echo "  重启服务: ./restart.sh"
    echo ""

    if [[ "$1" == "--confirm" ]]; then
        echo "⚠️  警告: 所有 JieCool 相关服务已停止"
        echo "   网站将无法访问，直到重新启动服务"
        echo ""
    fi
}

# 主函数
main() {
    local confirm_mode=false

    # 检查参数
    if [[ "$1" == "--confirm" ]]; then
        confirm_mode=true
    fi

    echo ""
    echo "============================================"
    echo "         JieCool 服务停止工具"
    echo "============================================"
    echo ""

    if [[ "$confirm_mode" == false ]]; then
        echo "警告: 即将停止所有 JieCool 服务"
        echo "网站将暂时无法访问"
        echo ""
        read -p "确认停止服务? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "操作已取消"
            exit 0
        fi
    fi

    # 执行停止步骤
    check_permissions
    stop_backend
    stop_nginx
    force_stop_processes
    cleanup_temp_files
    show_stop_info "$1"
}

# 错误处理
trap 'log_error "停止过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"