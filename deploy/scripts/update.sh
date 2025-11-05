#!/bin/bash

# =============================================================================
# JieCool 更新部署脚本
# 版本: v1.0.0
# 描述: 安全更新 JieCool 应用程序，支持备份和回滚
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
    echo "JieCool 更新部署工具"
    echo ""
    echo "用法: $0 [选项] [更新包路径]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -b, --backup        强制创建备份"
    echo "  -r, --rollback      回滚到上一个版本"
    echo "  -f, --force         强制更新，跳过确认"
    echo "  -d, --dry-run       模拟运行，不执行实际更新"
    echo "  --no-backup         跳过备份步骤"
    echo "  --no-restart        更新后不重启服务"
    echo ""
    echo "示例:"
    echo "  $0                          # 交互式更新"
    echo "  $0 /path/to/update.zip       # 从指定文件更新"
    echo "  $0 --rollback               # 回滚到上一版本"
    echo "  $0 --backup --force         # 强制备份并更新"
    echo "  $0 --dry-run                # 模拟更新"
    echo ""
}

# 解析命令行参数
parse_args() {
    FORCE_BACKUP=false
    ROLLBACK_MODE=false
    FORCE_UPDATE=false
    DRY_RUN=false
    NO_BACKUP=false
    NO_RESTART=false
    UPDATE_FILE=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--backup)
                FORCE_BACKUP=true
                shift
                ;;
            -r|--rollback)
                ROLLBACK_MODE=true
                shift
                ;;
            -f|--force)
                FORCE_UPDATE=true
                shift
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            --no-backup)
                NO_BACKUP=true
                shift
                ;;
            --no-restart)
                NO_RESTART=true
                shift
                ;;
            -*)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
            *)
                if [[ -z "$UPDATE_FILE" ]]; then
                    UPDATE_FILE="$1"
                else
                    log_error "只能指定一个更新文件"
                    exit 1
                fi
                shift
                ;;
        esac
    done
}

# 加载配置
load_config() {
    if [[ ! -f "config.env" ]]; then
        log_error "未找到配置文件 config.env"
        exit 1
    fi

    source config.env
    log_info "配置文件加载完成"
}

# 检查环境
check_environment() {
    log_step "检查更新环境..."

    # 检查必要目录
    local required_dirs=("backups" "logs")
    for dir in "${required_dirs[@]}"; do
        if [[ ! -d "$dir" ]]; then
            log_info "创建目录: $dir"
            mkdir -p "$dir"
        fi
    done

    # 检查磁盘空间
    local available_space=$(df / | awk 'NR==2 {print $4}')
    local required_space=1048576  # 1GB in KB

    if [[ $available_space -lt $required_space ]]; then
        log_error "磁盘空间不足，至少需要 1GB 可用空间"
        exit 1
    fi

    # 检查服务状态
    if systemctl is-active --quiet jiecool-backend; then
        log_info "后端服务正在运行"
    else
        log_warn "后端服务未运行"
    fi

    log_info "环境检查完成"
}

# 创建备份
create_backup() {
    if [[ "$NO_BACKUP" == true ]]; then
        log_info "跳过备份步骤"
        return
    fi

    local backup_needed=false

    if [[ "$FORCE_BACKUP" == true ]]; then
        backup_needed=true
        log_info "强制备份模式"
    else
        # 检查是否有文件变化
        if [[ -f ".last_update" ]]; then
            local last_update=$(cat .last_update)
            local current_time=$(date +%s)
            local time_diff=$((current_time - last_update))

            # 如果超过24小时，建议备份
            if [[ $time_diff -gt 86400 ]]; then
                backup_needed=true
                log_info "距离上次更新超过24小时，建议备份"
            fi
        else
            backup_needed=true
            log_info "首次更新，需要备份"
        fi
    fi

    if [[ "$backup_needed" == true ]]; then
        if [[ "$FORCE_UPDATE" == false ]]; then
            echo "建议创建备份，以防更新失败"
            read -p "是否创建备份? (Y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                log_info "跳过备份"
                return
            fi
        fi

        log_step "创建备份..."

        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        local backup_dir="backups/$backup_name"

        mkdir -p "$backup_dir"

        # 备份关键文件和目录
        log_info "备份应用程序文件..."
        cp -r server "$backup_dir/" 2>/dev/null || true
        cp -r frontend "$backup_dir/" 2>/dev/null || true
        cp -r scripts "$backup_dir/" 2>/dev/null || true
        cp config.env "$backup_dir/" 2>/dev/null || true

        # 备份配置文件
        log_info "备份配置文件..."
        [[ -f "server/manifest/config/config.yaml" ]] && cp server/manifest/config/config.yaml "$backup_dir/"

        # 备份数据库（可选）
        log_info "备份数据库..."
        if command -v pg_dump &> /dev/null && [[ -n "$DB_HOST" ]]; then
            export PGPASSWORD="$DB_PASSWORD"
            if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$backup_dir/database.sql" 2>/dev/null; then
                gzip "$backup_dir/database.sql"
                log_info "数据库备份完成"
            else
                log_warn "数据库备份失败"
            fi
        fi

        # 创建备份信息文件
        cat > "$backup_dir/backup_info.txt" << EOF
JieCool 备份信息
================
备份时间: $(date)
备份原因: 应用程序更新
备份版本: 当前版本

备份内容:
- 服务器二进制文件和配置
- 前端构建文件
- 脚本文件
- 配置文件
- 数据库备份 (如果成功)

恢复方法:
1. 停止服务: ./stop.sh
2. 恢复文件: cp -r backups/$backup_name/* ./
3. 重启服务: ./start.sh
EOF

        # 记录备份
        echo "$backup_name" > backups/.last_backup
        log_success "备份创建完成: $backup_dir"

        if [[ "$DRY_RUN" == false ]]; then
            # 压缩备份
            tar -czf "backups/$backup_name.tar.gz" -C backups "$backup_name"
            rm -rf "$backup_dir"
            log_info "备份已压缩: backups/$backup_name.tar.gz"
        fi
    fi
}

# 回滚操作
rollback() {
    log_step "执行回滚操作..."

    if [[ ! -f "backups/.last_backup" ]]; then
        log_error "未找到备份记录，无法回滚"
        exit 1
    fi

    local last_backup=$(cat backups/.last_backup)
    local backup_file="backups/$last_backup.tar.gz"

    if [[ ! -f "$backup_file" ]]; then
        log_error "备份文件不存在: $backup_file"
        exit 1
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "模拟模式: 将从备份文件回滚 $backup_file"
        return
    fi

    # 停止服务
    log_info "停止服务..."
    ./stop.sh --confirm

    # 创建当前版本的备份
    log_info "创建回滚前备份..."
    local rollback_backup="rollback_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "backups/$rollback_backup"
    cp -r server "backups/$rollback_backup/" 2>/dev/null || true
    cp -r frontend "backups/$rollback_backup/" 2>/dev/null || true
    cp config.env "backups/$rollback_backup/" 2>/dev/null || true

    # 解压备份文件
    log_info "恢复备份文件..."
    tar -xzf "$backup_file" -C backups/

    # 恢复文件
    local backup_dir="backups/$last_backup"
    if [[ -d "$backup_dir" ]]; then
        # 备份当前文件
        log_info "备份当前文件..."
        [[ -d "server" ]] && mv server server.backup.$(date +%Y%m%d_%H%M%S)
        [[ -d "frontend" ]] && mv frontend frontend.backup.$(date +%Y%m%d_%H%M%S)
        [[ -f "config.env" ]] && mv config.env config.env.backup.$(date +%Y%m%d_%H%M%S)

        # 恢复备份文件
        log_info "恢复文件..."
        [[ -d "$backup_dir/server" ]] && cp -r "$backup_dir/server" ./
        [[ -d "$backup_dir/frontend" ]] && cp -r "$backup_dir/frontend" ./
        [[ -f "$backup_dir/config.env" ]] && cp "$backup_dir/config.env" ./

        log_success "文件恢复完成"
    else
        log_error "备份目录不存在: $backup_dir"
        exit 1
    fi

    # 启动服务
    if [[ "$NO_RESTART" == false ]]; then
        log_info "重启服务..."
        ./start.sh
    fi

    log_success "回滚完成！"
}

# 准备更新文件
prepare_update() {
    if [[ -z "$UPDATE_FILE" ]]; then
        log_error "请指定更新文件路径"
        show_help
        exit 1
    fi

    if [[ ! -f "$UPDATE_FILE" ]]; then
        log_error "更新文件不存在: $UPDATE_FILE"
        exit 1
    fi

    log_step "准备更新文件: $UPDATE_FILE"

    # 检查文件格式
    if [[ "$UPDATE_FILE" =~ \.zip$ ]]; then
        log_info "检测到 ZIP 更新包"
        return
    elif [[ "$UPDATE_FILE" =~ \.tar\.gz$ ]]; then
        log_info "检测到 TAR.GZ 更新包"
        return
    else
        log_error "不支持的更新文件格式，仅支持 .zip 和 .tar.gz"
        exit 1
    fi
}

# 验证更新包
verify_update_package() {
    log_step "验证更新包..."

    local temp_dir="temp_update_$(date +%Y%m%d_%H%M%S)"

    if [[ "$DRY_RUN" == true ]]; then
        log_info "模拟模式: 跳过验证"
        return
    fi

    mkdir -p "$temp_dir"

    # 解压到临时目录
    if [[ "$UPDATE_FILE" =~ \.zip$ ]]; then
        unzip -q "$UPDATE_FILE" -d "$temp_dir"
    elif [[ "$UPDATE_FILE" =~ \.tar\.gz$ ]]; then
        tar -xzf "$UPDATE_FILE" -C "$temp_dir"
    fi

    # 检查必要文件
    local required_files=("server/main" "frontend/out/index.html" "config.env")
    local missing_files=()

    for file in "${required_files[@]}"; do
        if [[ ! -f "$temp_dir/$file" ]]; then
            missing_files+=("$file")
        fi
    done

    if [[ ${#missing_files[@]} -gt 0 ]]; then
        log_error "更新包缺少必要文件:"
        for file in "${missing_files[@]}"; do
            echo "  - $file"
        done
        rm -rf "$temp_dir"
        exit 1
    fi

    # 清理临时目录
    rm -rf "$temp_dir"

    log_info "更新包验证通过"
}

# 执行更新
perform_update() {
    log_step "执行更新..."

    if [[ "$DRY_RUN" == true ]]; then
        log_info "模拟模式: 跳过实际更新"
        return
    fi

    # 停止服务
    log_info "停止服务..."
    ./stop.sh --confirm

    # 备份当前文件
    log_info "备份当前文件..."
    local current_backup="update_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "backups/$current_backup"

    [[ -d "server" ]] && cp -r server "backups/$current_backup/"
    [[ -d "frontend" ]] && cp -r frontend "backups/$current_backup/"
    [[ -f "config.env" ]] && cp config.env "backups/$current_backup/"
    [[ -d "scripts" ]] && cp -r scripts "backups/$current_backup/"

    # 解压更新文件
    log_info "解压更新文件..."
    local temp_update="temp_update_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$temp_update"

    if [[ "$UPDATE_FILE" =~ \.zip$ ]]; then
        unzip -q "$UPDATE_FILE" -d "$temp_update"
    elif [[ "$UPDATE_FILE" =~ \.tar\.gz$ ]]; then
        tar -xzf "$UPDATE_FILE" -C "$temp_update"
    fi

    # 移动文件到正确位置
    if [[ -d "$temp_update/server" ]]; then
        rm -rf server
        mv "$temp_update/server" ./
    fi

    if [[ -d "$temp_update/frontend" ]]; then
        rm -rf frontend
        mv "$temp_update/frontend" ./
    fi

    if [[ -f "$temp_update/config.env" ]]; then
        # 保留现有配置，使用新配置作为模板
        mv "$temp_update/config.env" config.env.template
        log_info "新配置文件保存为 config.env.template"
    fi

    if [[ -d "$temp_update/scripts" ]]; then
        cp -r "$temp_update/scripts"/* scripts/ 2>/dev/null || true
    fi

    # 设置权限
    chmod +x server/main 2>/dev/null || true
    chmod +x scripts/*.sh 2>/dev/null || true

    # 清理临时文件
    rm -rf "$temp_update"

    # 记录更新时间
    date +%s > .last_update

    log_info "文件更新完成"
}

# 重启和验证
restart_and_verify() {
    if [[ "$NO_RESTART" == true ]]; then
        log_info "跳过服务重启"
        return
    fi

    if [[ "$DRY_RUN" == true ]]; then
        log_info "模拟模式: 跳过重启验证"
        return
    fi

    log_step "重启服务并验证..."

    # 重启服务
    ./start.sh

    # 等待服务启动
    sleep 5

    # 健康检查
    log_info "执行健康检查..."
    if curl -f -s "http://localhost:8080/api/health" &> /dev/null; then
        log_success "后端服务健康检查通过"
    else
        log_error "后端服务健康检查失败！"
        log_info "可能需要回滚: ./update.sh --rollback"
        exit 1
    fi

    if curl -f -s -I "http://localhost" &> /dev/null; then
        log_success "前端访问正常"
    else
        log_warn "前端访问可能有问题"
    fi
}

# 清理旧备份
cleanup_old_backups() {
    log_step "清理旧备份..."

    # 保留最近5个备份
    local backup_count=$(ls -1 backups/*.tar.gz 2>/dev/null | wc -l)
    if [[ $backup_count -gt 5 ]]; then
        ls -1t backups/*.tar.gz | tail -n +6 | xargs rm -f
        log_info "已清理旧备份文件"
    fi

    # 清理超过30天的备份目录
    find backups -name "backup_*" -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
}

# 显示更新结果
show_update_result() {
    log_step "🎉 更新完成！"

    echo ""
    echo "============================================"
    echo "           JieCool 更新成功"
    echo "============================================"
    echo ""

    echo "更新信息:"
    echo "  更新文件: $UPDATE_FILE"
    echo "  更新时间: $(date)"
    echo ""

    if [[ "$NO_BACKUP" == false && "$FORCE_BACKUP" == false ]]; then
        echo "备份信息:"
        if [[ -f "backups/.last_backup" ]]; then
            echo "  备份文件: backups/$(cat backups/.last_backup).tar.gz"
        fi
        echo ""
    fi

    echo "服务状态:"
    if systemctl is-active --quiet jiecool-backend; then
        echo "  ✅ 后端服务: 运行正常"
    else
        echo "  ❌ 后端服务: 未运行"
    fi

    if systemctl is-active --quiet nginx; then
        echo "  ✅ Nginx: 运行正常"
    else
        echo "  ❌ Nginx: 未运行"
    fi

    echo ""
    echo "访问测试:"
    echo "  前端: http://localhost"
    echo "  后端 API: http://localhost:8080/api/"
    echo ""

    echo "管理命令:"
    echo "  查看状态: ./status.sh"
    echo "  回滚版本: ./update.sh --rollback"
    echo "  查看日志: ./logs.sh"
    echo ""

    if [[ "$DRY_RUN" == true ]]; then
        echo "⚠️  这是模拟运行，未执行实际更新"
        echo ""
    fi
}

# 主函数
main() {
    # 解析参数
    parse_args "$@"

    echo ""
    echo "============================================"
    echo "         JieCool 更新部署工具"
    echo "============================================"
    echo ""

    if [[ "$DRY_RUN" == true ]]; then
        echo "运行模式: 模拟运行 (不会执行实际操作)"
    elif [[ "$ROLLBACK_MODE" == true ]]; then
        echo "运行模式: 回滚到上一版本"
    else
        echo "运行模式: 更新部署"
    fi

    echo ""

    # 执行更新流程
    load_config
    check_environment

    if [[ "$ROLLBACK_MODE" == true ]]; then
        rollback
        show_update_result
    else
        prepare_update
        verify_update_package
        create_backup
        perform_update
        restart_and_verify
        cleanup_old_backups
        show_update_result
    fi
}

# 错误处理
trap 'log_error "更新过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"