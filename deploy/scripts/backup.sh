#!/bin/bash

# =============================================================================
# JieCool 数据备份脚本
# 版本: v1.0.0
# 描述: 备份应用程序数据、配置和数据库
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

log_success() {
    echo -e "${CYAN}[SUCCESS]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "JieCool 数据备份工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -q, --quick         快速备份（仅备份数据库和配置）"
    echo "  -f, --full          完整备份（包含所有文件）"
    echo "  -d, --database      仅备份数据库"
    echo "  -c, --config        仅备份配置文件"
    echo "  -u, --uploads       仅备份上传文件"
    echo "  -l, --logs          仅备份日志文件"
    echo "  -o, --output DIR    指定备份输出目录"
    echo "  --compress LEVEL    压缩级别 (1-9, 默认 6)"
    echo "  --no-compress       不压缩备份文件"
    echo "  --no-verify         跳过备份验证"
    echo ""
    echo "示例:"
    echo "  $0                  # 标准备份"
    echo "  $0 --full           # 完整备份"
    echo "  $0 --quick          # 快速备份"
    echo "  $0 --database       # 仅备份数据库"
    echo "  $0 -o /backup/dir   # 指定输出目录"
    echo ""
}

# 解析命令行参数
parse_args() {
    QUICK_MODE=false
    FULL_MODE=false
    DATABASE_ONLY=false
    CONFIG_ONLY=false
    UPLOADS_ONLY=false
    LOGS_ONLY=false
    OUTPUT_DIR=""
    COMPRESS_LEVEL=6
    NO_COMPRESS=false
    NO_VERIFY=false

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
            -f|--full)
                FULL_MODE=true
                shift
                ;;
            -d|--database)
                DATABASE_ONLY=true
                shift
                ;;
            -c|--config)
                CONFIG_ONLY=true
                shift
                ;;
            -u|--uploads)
                UPLOADS_ONLY=true
                shift
                ;;
            -l|--logs)
                LOGS_ONLY=true
                shift
                ;;
            -o|--output)
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --compress)
                COMPRESS_LEVEL="$2"
                shift 2
                ;;
            --no-compress)
                NO_COMPRESS=true
                shift
                ;;
            --no-verify)
                NO_VERIFY=true
                shift
                ;;
            -*)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
            *)
                log_error "不支持的位置参数: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # 验证压缩级别
    if [[ ! "$COMPRESS_LEVEL" =~ ^[1-9]$ ]]; then
        log_error "压缩级别必须是 1-9 之间的数字"
        exit 1
    fi

    # 检查互斥参数
    local exclusive_count=0
    [[ "$DATABASE_ONLY" == true ]] && ((exclusive_count++))
    [[ "$CONFIG_ONLY" == true ]] && ((exclusive_count++))
    [[ "$UPLOADS_ONLY" == true ]] && ((exclusive_count++))
    [[ "$LOGS_ONLY" == true ]] && ((exclusive_count++))

    if [[ $exclusive_count -gt 1 ]]; then
        log_error "不能同时指定多个备份类型选项"
        exit 1
    fi
}

# 加载配置
load_config() {
    if [[ -f "config.env" ]]; then
        source config.env
        log_info "配置文件加载完成"
    else
        log_warn "未找到配置文件 config.env，跳过数据库备份"
    fi
}

# 设置备份目录
setup_backup_directory() {
    local backup_base_dir="${OUTPUT_DIR:-backups}"
    local timestamp=$(date +%Y%m%d_%H%M%S)

    if [[ "$QUICK_MODE" == true ]]; then
        BACKUP_DIR="$backup_base_dir/quick_backup_$timestamp"
    elif [[ "$FULL_MODE" == true ]]; then
        BACKUP_DIR="$backup_base_dir/full_backup_$timestamp"
    elif [[ "$DATABASE_ONLY" == true ]]; then
        BACKUP_DIR="$backup_base_dir/db_backup_$timestamp"
    elif [[ "$CONFIG_ONLY" == true ]]; then
        BACKUP_DIR="$backup_base_dir/config_backup_$timestamp"
    elif [[ "$UPLOADS_ONLY" == true ]]; then
        BACKUP_DIR="$backup_base_dir/uploads_backup_$timestamp"
    elif [[ "$LOGS_ONLY" == true ]]; then
        BACKUP_DIR="$backup_base_dir/logs_backup_$timestamp"
    else
        BACKUP_DIR="$backup_base_dir/backup_$timestamp"
    fi

    mkdir -p "$BACKUP_DIR"
    log_info "备份目录: $BACKUP_DIR"
}

# 检查磁盘空间
check_disk_space() {
    log_step "检查磁盘空间..."

    local available_space=$(df -P "$BACKUP_DIR" | awk 'NR==2 {print $4}')
    local required_space=524288  # 512MB in KB

    if [[ $available_space -lt $required_space ]]; then
        log_error "磁盘空间不足，至少需要 512MB 可用空间"
        exit 1
    fi

    log_info "磁盘空间检查通过"
}

# 备份数据库
backup_database() {
    if [[ "$QUICK_MODE" == false && "$CONFIG_ONLY" == false && "$UPLOADS_ONLY" == false && "$LOGS_ONLY" == false ]]; then
        log_step "备份数据库..."

        if [[ -z "$DB_HOST" || -z "$DB_USER" || -z "$DB_NAME" ]]; then
            log_warn "数据库配置不完整，跳过数据库备份"
            return
        fi

        export PGPASSWORD="$DB_PASSWORD"

        # 备份数据库
        local db_file="$BACKUP_DIR/database.sql"
        if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$db_file" 2>/dev/null; then
            log_info "数据库备份完成"

            # 压缩数据库备份
            if [[ "$NO_COMPRESS" == false ]]; then
                log_info "压缩数据库备份..."
                gzip -$COMPRESS_LEVEL "$db_file"
                db_file="${db_file}.gz"
            fi

            # 记录备份信息
            echo "数据库备份: $db_file" >> "$BACKUP_DIR/backup_manifest.txt"
            echo "备份时间: $(date)" >> "$BACKUP_DIR/backup_manifest.txt"
            echo "数据库大小: $(stat -c%s "$db_file" 2>/dev/null || echo 0) 字节" >> "$BACKUP_DIR/backup_manifest.txt"
            echo "" >> "$BACKUP_DIR/backup_manifest.txt"

            log_success "数据库备份成功: $(basename "$db_file")"
        else
            log_error "数据库备份失败"
            return 1
        fi
    fi
}

# 备份配置文件
backup_config() {
    if [[ "$DATABASE_ONLY" == false && "$UPLOADS_ONLY" == false && "$LOGS_ONLY" == false ]]; then
        log_step "备份配置文件..."

        local config_backup_dir="$BACKUP_DIR/config"
        mkdir -p "$config_backup_dir"

        # 备份主配置文件
        if [[ -f "config.env" ]]; then
            cp config.env "$config_backup_dir/"
            echo "config.env" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        # 备份后端配置
        if [[ -f "server/manifest/config/config.yaml" ]]; then
            cp server/manifest/config/config.yaml "$config_backup_dir/"
            echo "server/manifest/config/config.yaml" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        # 备份 Nginx 配置
        if [[ -f "/etc/nginx/sites-available/jiecool" ]]; then
            sudo cp /etc/nginx/sites-available/jiecool "$config_backup_dir/nginx_jiecool"
            echo "nginx_jiecool" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        # 备份 systemd 服务配置
        if [[ -f "/etc/systemd/system/jiecool-backend.service" ]]; then
            sudo cp /etc/systemd/system/jiecool-backend.service "$config_backup_dir/"
            echo "jiecool-backend.service" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        log_success "配置文件备份完成"
    fi
}

# 备份上传文件
backup_uploads() {
    if [[ "$QUICK_MODE" == false && "$DATABASE_ONLY" == false && "$CONFIG_ONLY" == false && "$LOGS_ONLY" == false ]]; then
        log_step "备份上传文件..."

        if [[ -d "uploads" ]]; then
            local uploads_backup_dir="$BACKUP_DIR/uploads"
            mkdir -p "$uploads_backup_dir"

            # 计算上传文件大小
            local uploads_size=$(du -sb uploads 2>/dev/null | cut -f1 || echo 0)

            if [[ $uploads_size -gt 0 ]]; then
                log_info "上传文件大小: $(du -sh uploads | cut -f1)"

                # 使用 rsync 进行增量备份
                if command -v rsync &> /dev/null; then
                    rsync -av --progress uploads/ "$uploads_backup_dir/"
                else
                    cp -r uploads/* "$uploads_backup_dir/"
                fi

                echo "uploads/ -> uploads/ ($uploads_size 字节)" >> "$BACKUP_DIR/backup_manifest.txt"
                log_success "上传文件备份完成"
            else
                log_info "上传目录为空，跳过备份"
            fi
        else
            log_warn "上传目录不存在，跳过备份"
        fi
    fi
}

# 备份日志文件
backup_logs() {
    if [[ "$QUICK_MODE" == false && "$DATABASE_ONLY" == false && "$CONFIG_ONLY" == false && "$UPLOADS_ONLY" == false ]]; then
        log_step "备份日志文件..."

        local logs_backup_dir="$BACKUP_DIR/logs"
        mkdir -p "$logs_backup_dir"

        # 备份应用日志
        if [[ -f "logs/app.log" ]]; then
            cp logs/app.log "$logs_backup_dir/"
            echo "logs/app.log" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        # 备份系统日志
        if command -v journalctl &> /dev/null; then
            # 备份后端服务日志
            if sudo journalctl -u jiecool-backend --no-pager -n 1000 > "$logs_backup_dir/jiecool-backend.log" 2>/dev/null; then
                echo "jiecool-backend 服务日志" >> "$BACKUP_DIR/backup_manifest.txt"
            fi

            # 备份 Nginx 日志
            if sudo journalctl -u nginx --no-pager -n 1000 > "$logs_backup_dir/nginx.log" 2>/dev/null; then
                echo "nginx 服务日志" >> "$BACKUP_DIR/backup_manifest.txt"
            fi
        fi

        # 备份其他日志文件
        for log_file in logs/*.log; do
            if [[ -f "$log_file" ]]; then
                cp "$log_file" "$logs_backup_dir/"
                echo "$(basename "$log_file")" >> "$BACKUP_DIR/backup_manifest.txt"
            fi
        done

        log_success "日志文件备份完成"
    fi
}

# 备份应用程序文件
backup_application() {
    if [[ "$FULL_MODE" == true ]]; then
        log_step "备份应用程序文件..."

        local app_backup_dir="$BACKUP_DIR/application"
        mkdir -p "$app_backup_dir"

        # 备份后端文件
        if [[ -d "server" ]]; then
            cp -r server "$app_backup_dir/"
            echo "server/" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        # 备份前端文件
        if [[ -d "frontend" ]]; then
            cp -r frontend "$app_backup_dir/"
            echo "frontend/" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        # 备份脚本文件
        if [[ -d "scripts" ]]; then
            cp -r scripts "$app_backup_dir/"
            echo "scripts/" >> "$BACKUP_DIR/backup_manifest.txt"
        fi

        log_success "应用程序文件备份完成"
    fi
}

# 创建备份信息文件
create_backup_info() {
    log_step "创建备份信息文件..."

    cat > "$BACKUP_DIR/backup_info.txt" << EOF
JieCool 备份信息
================

备份类型: $([ "$QUICK_MODE" == true ] && echo "快速备份" || \
          [ "$FULL_MODE" == true ] && echo "完整备份" || \
          [ "$DATABASE_ONLY" == true ] && echo "数据库备份" || \
          [ "$CONFIG_ONLY" == true ] && echo "配置备份" || \
          [ "$UPLOADS_ONLY" == true ] && echo "上传文件备份" || \
          [ "$LOGS_ONLY" == true ] && echo "日志备份" || \
          echo "标准备份")

备份时间: $(date)
备份目录: $(pwd)
备份脚本版本: v1.0.0

系统信息:
- 操作系统: $(uname -s) $(uname -r)
- 架构: $(uname -m)
- 主机名: $(hostname)
- 用户: $(whoami)

磁盘使用情况:
$(df -h / | tail -n +2)

服务状态:
- 后端服务: $(systemctl is-active jiecool-backend 2>/dev/null || echo "未知")
- Nginx: $(systemctl is-active nginx 2>/dev/null || echo "未知")

恢复方法:
1. 停止服务: ./stop.sh
2. 恢复文件: 根据需要恢复相应目录
3. 重启服务: ./start.sh

注意事项:
- 恢复数据库: psql -h localhost -U username -d database < database.sql
- 检查配置文件是否需要更新
- 确保文件权限正确设置
EOF

    log_success "备份信息文件创建完成"
}

# 压缩备份
compress_backup() {
    if [[ "$NO_COMPRESS" == false ]]; then
        log_step "压缩备份文件..."

        local archive_name="${BACKUP_DIR}.tar.gz"
        local base_dir=$(dirname "$BACKUP_DIR")
        local backup_name=$(basename "$BACKUP_DIR")

        # 创建压缩包
        if tar -czf "$archive_name" -C "$base_dir" "$backup_name" --use-compress-program="gzip -$COMPRESS_LEVEL"; then
            # 计算压缩率
            local original_size=$(du -sb "$BACKUP_DIR" | cut -f1)
            local compressed_size=$(stat -c%s "$archive_name")
            local compression_ratio=$(echo "scale=2; (1 - $compressed_size / $original_size) * 100" | bc 2>/dev/null || echo "N/A")

            log_success "备份压缩完成"
            log_info "原始大小: $(du -sh "$BACKUP_DIR" | cut -f1)"
            log_info "压缩大小: $(du -sh "$archive_name" | cut -f1)"
            [[ "$compression_ratio" != "N/A" ]] && log_info "压缩率: ${compression_ratio}%"

            # 删除原始目录
            rm -rf "$BACKUP_DIR"
            BACKUP_FILE="$archive_name"
        else
            log_error "备份压缩失败"
            exit 1
        fi
    else
        BACKUP_FILE="$BACKUP_DIR"
    fi
}

# 验证备份
verify_backup() {
    if [[ "$NO_VERIFY" == false ]]; then
        log_step "验证备份文件..."

        if [[ -f "$BACKUP_FILE" ]]; then
            # 检查文件大小
            local file_size=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || echo 0)
            if [[ $file_size -gt 0 ]]; then
                log_info "备份文件大小: $(du -sh "$BACKUP_FILE" | cut -f1)"

                # 如果是压缩文件，测试完整性
                if [[ "$BACKUP_FILE" =~ \.tar\.gz$ ]]; then
                    if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
                        log_success "备份文件验证通过"
                    else
                        log_error "备份文件验证失败"
                        exit 1
                    fi
                fi
            else
                log_error "备份文件为空"
                exit 1
            fi
        else
            log_error "备份文件不存在"
            exit 1
        fi
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_step "清理旧备份..."

    local backup_base_dir="${OUTPUT_DIR:-backups}"
    local keep_count=10

    # 清理压缩备份文件
    local backup_files=($(ls -1t "$backup_base_dir"/*.tar.gz 2>/dev/null || true))
    if [[ ${#backup_files[@]} -gt $keep_count ]]; then
        for file in "${backup_files[@]:$keep_count}"; do
            rm -f "$file"
            log_info "删除旧备份: $(basename "$file")"
        done
    fi

    # 清理超过30天的备份目录
    find "$backup_base_dir" -maxdepth 1 -name "*backup_*" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true

    log_success "旧备份清理完成"
}

# 显示备份结果
show_backup_result() {
    log_step "🎉 备份完成！"

    echo ""
    echo "============================================"
    echo "           JieCool 数据备份完成"
    echo "============================================"
    echo ""

    echo "备份信息:"
    echo "  备份文件: $BACKUP_FILE"
    echo "  备份时间: $(date)"
    echo "  备份类型: $([ "$QUICK_MODE" == true ] && echo "快速备份" || \
                  [ "$FULL_MODE" == true ] && echo "完整备份" || \
                  [ "$DATABASE_ONLY" == true ] && echo "数据库备份" || \
                  [ "$CONFIG_ONLY" == true ] && echo "配置备份" || \
                  [ "$UPLOADS_ONLY" == true ] && echo "上传文件备份" || \
                  [ "$LOGS_ONLY" == true ] && echo "日志备份" || \
                  echo "标准备份")"
    echo ""

    if [[ -f "$BACKUP_FILE" ]]; then
        echo "备份统计:"
        echo "  文件大小: $(du -sh "$BACKUP_FILE" | cut -f1)"
        echo "  文件路径: $(pwd)/$BACKUP_FILE"
        echo ""
    fi

    echo "管理命令:"
    echo "  查看备份: ls -la backups/"
    echo "  恢复备份: 参考 backup_info.txt 中的恢复方法"
    echo "  定期备份: 添加到 crontab: 0 2 * * * $(pwd)/backup.sh"
    echo ""

    # 备份建议
    echo "备份建议:"
    echo "  - 定期将备份文件转移到其他位置"
    echo "  - 测试备份文件的恢复过程"
    echo "  - 保留多个版本的备份"
    echo "  - 监控磁盘空间使用情况"
    echo ""
}

# 主函数
main() {
    # 解析参数
    parse_args "$@"

    echo ""
    echo "============================================"
    echo "         JieCool 数据备份工具"
    echo "============================================"
    echo ""

    # 执行备份流程
    load_config
    setup_backup_directory
    check_disk_space
    backup_database
    backup_config
    backup_uploads
    backup_logs
    backup_application
    create_backup_info
    compress_backup
    verify_backup
    cleanup_old_backups
    show_backup_result
}

# 错误处理
trap 'log_error "备份过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"