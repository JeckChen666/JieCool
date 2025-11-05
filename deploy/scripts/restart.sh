#!/bin/bash

# =============================================================================
# JieCool 服务重启脚本
# 版本: v1.0.0
# 描述: 重启 JieCool 后端服务和相关组件
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

# 显示帮助信息
show_help() {
    echo "JieCool 服务重启工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -q, --quick    快速重启（仅重启服务，不进行健康检查）"
    echo "  -f, --force    强制重启（停止后强制清理进程）"
    echo "  -b, --backend  仅重启后端服务"
    echo "  -n, --nginx    仅重启 Nginx"
    echo ""
    echo "示例:"
    echo "  $0              # 正常重启所有服务"
    echo "  $0 --quick      # 快速重启"
    echo "  $0 --backend    # 仅重启后端"
    echo "  $0 --nginx      # 仅重启 Nginx"
    echo ""
}

# 解析命令行参数
parse_args() {
    QUICK_MODE=false
    FORCE_MODE=false
    BACKEND_ONLY=false
    NGINX_ONLY=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -q|--quick)
                QUICK_MODE=true
                shift
                ;;
            -f|--force)
                FORCE_MODE=true
                shift
                ;;
            -b|--backend)
                BACKEND_ONLY=true
                shift
                ;;
            -n|--nginx)
                NGINX_ONLY=true
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 检查互斥参数
    if [[ "$BACKEND_ONLY" == true && "$NGINX_ONLY" == true ]]; then
        log_error "不能同时指定 --backend 和 --nginx"
        exit 1
    fi
}

# 停止服务
stop_services() {
    log_step "停止服务..."

    if [[ "$NGINX_ONLY" == false ]]; then
        # 停止后端服务
        if systemctl is-active --quiet jiecool-backend 2>/dev/null; then
            log_info "停止后端服务..."
            if sudo systemctl stop jiecool-backend; then
                log_info "后端服务已停止"
            else
                log_error "后端服务停止失败"
                exit 1
            fi
        else
            log_info "后端服务未运行"
        fi
    fi

    if [[ "$BACKEND_ONLY" == false ]]; then
        # 停止 Nginx
        if systemctl is-active --quiet nginx 2>/dev/null; then
            log_info "停止 Nginx 服务..."
            if sudo systemctl stop nginx; then
                log_info "Nginx 服务已停止"
            else
                log_error "Nginx 服务停止失败"
                exit 1
            fi
        else
            log_info "Nginx 服务未运行"
        fi
    fi

    # 等待服务完全停止
    sleep 2

    # 强制模式清理
    if [[ "$FORCE_MODE" == true ]]; then
        log_step "强制清理残留进程..."
        local pids=$(pgrep -f "server/main" 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            echo "$pids" | xargs sudo kill -TERM 2>/dev/null || true
            sleep 1
            pids=$(pgrep -f "server/main" 2>/dev/null || true)
            if [[ -n "$pids" ]]; then
                echo "$pids" | xargs sudo kill -KILL 2>/dev/null || true
            fi
        fi
    fi
}

# 启动服务
start_services() {
    log_step "启动服务..."

    if [[ "$BACKEND_ONLY" == false ]]; then
        # 启动 Nginx
        log_info "启动 Nginx 服务..."
        if sudo systemctl start nginx; then
            log_info "Nginx 服务启动成功"
        else
            log_error "Nginx 服务启动失败"
            sudo journalctl -u nginx --no-pager -n 10
            exit 1
        fi
    fi

    if [[ "$NGINX_ONLY" == false ]]; then
        # 启动后端服务
        log_info "启动后端服务..."
        if sudo systemctl start jiecool-backend; then
            log_info "后端服务启动成功"
        else
            log_error "后端服务启动失败"
            sudo journalctl -u jiecool-backend --no-pager -n 20
            exit 1
        fi
    fi

    # 等待服务启动
    sleep 3
}

# 验证服务状态
verify_services() {
    if [[ "$QUICK_MODE" == true ]]; then
        log_info "快速重启模式，跳过健康检查"
        return
    fi

    log_step "验证服务状态..."

    # 检查后端服务
    if [[ "$NGINX_ONLY" == false ]]; then
        if systemctl is-active --quiet jiecool-backend; then
            log_info "✅ 后端服务运行正常"

            # 健康检查
            local max_attempts=10
            local attempt=1

            while [[ $attempt -le $max_attempts ]]; do
                if curl -f -s "http://localhost:8080/api/health" &> /dev/null; then
                    log_info "✅ 后端 API 健康检查通过"
                    break
                fi

                if [[ $attempt -eq $max_attempts ]]; then
                    log_error "❌ 后端 API 健康检查失败！"
                    log_info "请检查服务日志: sudo journalctl -u jiecool-backend -f"
                    exit 1
                fi

                log_info "等待后端服务启动... ($attempt/$max_attempts)"
                sleep 2
                ((attempt++))
            done
        else
            log_error "❌ 后端服务未运行"
            exit 1
        fi
    fi

    # 检查 Nginx
    if [[ "$BACKEND_ONLY" == false ]]; then
        if systemctl is-active --quiet nginx; then
            log_info "✅ Nginx 服务运行正常"

            # 检查前端访问
            if curl -f -s -I "http://localhost" &> /dev/null; then
                log_info "✅ 前端访问正常"
            else
                log_warn "⚠️  前端访问可能有问题"
            fi
        else
            log_error "❌ Nginx 服务未运行"
            exit 1
        fi
    fi
}

# 显示重启信息
show_restart_info() {
    log_step "🔄 重启完成！"

    echo ""
    echo "============================================"
    echo "           JieCool 服务重启完成"
    echo "============================================"
    echo ""

    # 显示服务状态
    echo "服务状态:"
    if systemctl is-active --quiet jiecool-backend 2>/dev/null; then
        echo "  ✅ 后端服务: 运行中"
    else
        echo "  ❌ 后端服务: 未运行"
    fi

    if systemctl is-active --quiet nginx 2>/dev/null; then
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
    echo "  查看日志: ./logs.sh"
    echo ""

    if [[ "$QUICK_MODE" == true ]]; then
        echo "⚡ 快速重启模式完成"
    fi

    if [[ "$FORCE_MODE" == true ]]; then
        echo "🔒 强制重启模式完成"
    fi

    echo ""
}

# 主函数
main() {
    # 解析参数
    parse_args "$@"

    echo ""
    echo "============================================"
    echo "         JieCool 服务重启工具"
    echo "============================================"
    echo ""

    if [[ "$BACKEND_ONLY" == true ]]; then
        echo "重启模式: 仅后端服务"
    elif [[ "$NGINX_ONLY" == true ]]; then
        echo "重启模式: 仅 Nginx"
    elif [[ "$QUICK_MODE" == true ]]; then
        echo "重启模式: 快速重启"
    elif [[ "$FORCE_MODE" == true ]]; then
        echo "重启模式: 强制重启"
    else
        echo "重启模式: 正常重启"
    fi

    echo ""

    # 执行重启步骤
    stop_services
    start_services
    verify_services
    show_restart_info
}

# 错误处理
trap 'log_error "重启过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"