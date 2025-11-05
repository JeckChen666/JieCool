#!/bin/bash

# =============================================================================
# JieCool 服务状态检查脚本
# 版本: v1.0.0
# 描述: 检查 JieCool 所有服务的运行状态
# =============================================================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# 检查服务状态
check_service_status() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        return 0
    else
        return 1
    fi
}

# 获取服务信息
get_service_info() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        local pid=$(systemctl show "$service" -p MainPID --value)
        local uptime=$(systemctl show "$service" -p ActiveEnterTimestamp --value)
        local memory=$(systemctl status "$service" --no-pager | grep -i memory | awk '{print $3, $4}' || echo "N/A")

        echo "  🟢 状态: 运行中"
        echo "  📍 PID: $pid"
        echo "  ⏰ 启动时间: $uptime"
        echo "  💾 内存使用: $memory"
    else
        echo "  🔴 状态: 已停止"
        if systemctl is-failed --quiet "$service"; then
            echo "  ❌ 服务状态: 失败"
        fi
    fi
}

# 检查后端服务
check_backend() {
    log_step "检查后端服务..."

    echo "后端服务 (jiecool-backend):"
    get_service_info jiecool-backend

    # 检查进程
    local backend_process=$(pgrep -f "server/main" 2>/dev/null || echo "无")
    echo "  🔍 进程: $backend_process"

    # 检查端口
    local port_status=$(sudo netstat -tlnp 2>/dev/null | grep ":8080 " || echo "端口未监听")
    if [[ "$port_status" != "端口未监听" ]]; then
        echo "  🌐 端口 8080: 正在监听"
    else
        echo "  ❌ 端口 8080: 未监听"
    fi

    # 健康检查
    if curl -f -s "http://localhost:8080/api/health" &> /dev/null; then
        echo "  ✅ 健康检查: 通过"
    else
        echo "  ❌ 健康检查: 失败"
    fi

    echo ""
}

# 检查 Nginx
check_nginx() {
    log_step "检查 Nginx 服务..."

    echo "Nginx 服务:"
    get_service_info nginx

    # 检查端口
    local port_status=$(sudo netstat -tlnp 2>/dev/null | grep ":80 " || echo "端口未监听")
    if [[ "$port_status" != "端口未监听" ]]; then
        echo "  🌐 端口 80: 正在监听"
    else
        echo "  ❌ 端口 80: 未监听"
    fi

    # 检查配置
    if sudo nginx -t &> /dev/null; then
        echo "  ✅ 配置检查: 通过"
    else
        echo "  ❌ 配置检查: 失败"
    fi

    echo ""
}

# 检查数据库连接
check_database() {
    log_step "检查数据库连接..."

    # 尝试加载配置
    if [[ -f "config.env" ]]; then
        source config.env

        if [[ -n "$DB_HOST" && -n "$DB_USER" && -n "$DB_NAME" ]]; then
            export PGPASSWORD="$DB_PASSWORD"

            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &> /dev/null; then
                echo "  ✅ 数据库连接: 正常"
            else
                echo "  ❌ 数据库连接: 失败"
            fi
        else
            echo "  ⚠️  数据库配置不完整"
        fi
    else
        echo "  ⚠️  未找到数据库配置文件"
    fi

    echo ""
}

# 检查文件系统
check_filesystem() {
    log_step "检查文件系统..."

    # 检查关键目录
    local directories=("server" "frontend" "logs" "uploads" "backups")

    for dir in "${directories[@]}"; do
        if [[ -d "$dir" ]]; then
            local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
            local files=$(find "$dir" -type f 2>/dev/null | wc -l)
            echo "  📁 $dir: $size ($files 文件)"
        else
            echo "  ❌ $dir: 目录不存在"
        fi
    done

    # 检查磁盘空间
    local disk_usage=$(df -h / | awk 'NR==2 {print $4 " / " $2 " (" $5 " 使用)"}')
    echo "  💾 磁盘空间: $disk_usage"

    # 检查权限
    if [[ -x "server/main" ]]; then
        echo "  ✅ 后端二进制文件权限: 正常"
    else
        echo "  ❌ 后端二进制文件权限: 异常"
    fi

    echo ""
}

# 检查系统资源
check_system_resources() {
    log_step "检查系统资源..."

    # CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    echo "  🖥️  CPU 使用率: ${cpu_usage}%"

    # 内存使用
    local memory_info=$(free -h | awk 'NR==2{printf "%.1f%% (%s / %s)", $3*100/$2, $3, $2}')
    echo "  💾 内存使用: $memory_info"

    # 系统负载
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo "  📊 系统负载: $load_avg"

    # 网络连接
    local connections=$(ss -tn state established | wc -l)
    echo "  🌐 网络连接: $connections 个活跃连接"

    echo ""
}

# 检查日志
check_logs() {
    log_step "检查最近日志..."

    # 后端日志
    if sudo journalctl -u jiecool-backend --no-pager -n 5 --output=cat 2>/dev/null | grep -q "ERROR\|FATAL"; then
        echo "  ⚠️  后端日志: 发现错误信息"
        echo "  查看命令: sudo journalctl -u jiecool-backend -f"
    else
        echo "  ✅ 后端日志: 无异常"
    fi

    # 应用日志
    if [[ -f "logs/app.log" ]]; then
        local error_count=$(tail -100 logs/app.log 2>/dev/null | grep -c "ERROR\|FATAL" || echo 0)
        if [[ $error_count -gt 0 ]]; then
            echo "  ⚠️  应用日志: 最近发现 $error_count 个错误"
            echo "  查看命令: tail -f logs/app.log"
        else
            echo "  ✅ 应用日志: 无异常"
        fi
    else
        echo "  ℹ️  应用日志: 文件不存在"
    fi

    echo ""
}

# 显示摘要
show_summary() {
    log_step "📊 状态摘要"

    local services_ok=0
    local services_total=2

    if check_service_status jiecool-backend; then
        ((services_ok++))
    fi

    if check_service_status nginx; then
        ((services_ok++))
    fi

    echo ""
    echo "============================================"
    echo "           JieCool 服务状态摘要"
    echo "============================================"
    echo ""
    echo "服务状态: $services_ok/$services_total 服务运行正常"
    echo ""

    if [[ $services_ok -eq $services_total ]]; then
        echo "🎉 所有服务运行正常！"
        echo ""
        echo "访问地址:"
        echo "  前端: http://localhost"
        echo "  后端 API: http://localhost:8080/api/"
        echo "  API 文档: http://localhost:8080/swagger"
    else
        echo "⚠️  部分服务异常，请检查详细信息"
        echo ""
        echo "故障排除:"
        echo "  查看详细状态: ./status.sh --verbose"
        echo "  重启服务: ./restart.sh"
        echo "  查看日志: ./logs.sh"
    fi

    echo ""
    echo "快速操作:"
    echo "  启动服务: ./start.sh"
    echo "  停止服务: ./stop.sh"
    echo "  重启服务: ./restart.sh"
    echo "  查看日志: ./logs.sh"
    echo "  更新部署: ./update.sh"
    echo "  数据备份: ./backup.sh"
    echo ""
}

# 详细模式
verbose_mode() {
    log_step "详细信息模式"

    echo ""
    echo "============================================"
    echo "           详细服务信息"
    echo "============================================"
    echo ""

    # 显示详细的服务信息
    echo "后端服务详细信息:"
    sudo systemctl status jiecool-backend --no-pager
    echo ""

    echo "Nginx 服务详细信息:"
    sudo systemctl status nginx --no-pager
    echo ""

    echo "端口监听状态:"
    sudo netstat -tlnp | grep -E ":(80|8080) "
    echo ""

    echo "最近的系统日志:"
    sudo journalctl --no-pager -n 10 --grep="jiecool"
    echo ""
}

# 主函数
main() {
    local verbose=false

    # 检查参数
    if [[ "$1" == "--verbose" || "$1" == "-v" ]]; then
        verbose=true
    fi

    echo ""
    echo "============================================"
    echo "         JieCool 服务状态检查"
    echo "============================================"
    echo ""

    if [[ "$verbose" == true ]]; then
        verbose_mode
    else
        check_backend
        check_nginx
        check_database
        check_filesystem
        check_system_resources
        check_logs
        show_summary
    fi
}

# 错误处理
trap 'log_error "状态检查过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"