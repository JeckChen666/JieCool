# 数据库迁移脚本合并工具

本目录包含用于合并所有迁移脚本的工具。

## 📁 文件说明

- `merge_migrations.py` - Python 脚本（推荐，跨平台）

## 🚀 使用方法

### 使用Python脚本（推荐）

```bash
# 在 server/db 目录下执行
python merge_migrations.py

# 显示详细输出
python merge_migrations.py --verbose

# 预览文件列表（不合并）
python merge_migrations.py --preview

# 指定输出文件名
python merge_migrations.py --output custom_name.sql
```

### 命令行参数

- `--output FILE` 或 `-o FILE`: 指定输出文件名（默认: all_migrations.sql）
- `--preview` 或 `-p`: 预览文件列表，不实际合并
- `--verbose` 或 `-v`: 显示详细输出
- `--help` 或 `-h`: 显示帮助信息

## 📋 生成的文件

执行脚本后，会在 `server/db/` 目录下生成 `all_migrations.sql` 文件，包含：

- 所有迁移脚本的完整内容
- 文件分隔标识
- 执行时间戳和使用说明
- 统计信息和提示

## 🔧 执行合并后的SQL文件

### 1. 使用 psql 命令行工具

```bash
psql -h localhost -U jiecool_user -d JieCool -f all_migrations.sql
```

### 2. 使用 PostgreSQL GUI 工具

- 打开 pgAdmin 或 DBeaver
- 连接到 JieCool 数据库
- 打开查询工具
- 执行 `all_migrations.sql` 文件内容

### 3. 在应用中集成

可以在应用启动时执行合并后的SQL文件，适合自动化部署。

## ⚠️ 重要注意事项

### 1. 数据备份
- **执行前务必备份数据库**
- 合并脚本会删除所有现有对象再重建

### 2. 权限要求
- 确保数据库用户有足够的权限：
  - CREATE、DROP 权限
  - 创建函数、触发器的权限
  - 操作索引和约束的权限

### 3. 依赖关系
- 脚本按文件名顺序执行（0001-0010）
- 跳过 0003（之前编号错误）
- 确保在正确的环境中执行

### 4. 测试验证
- **强烈建议先在测试环境验证**
- 检查执行过程中的错误信息
- 验证所有表和对象是否正确创建

## 📁 文件列表（将按此顺序合并）

| 编号 | 文件名 | 描述 |
|------|--------|------|
| 0001 | `0001_init_dynamic_configs.sql` | 动态配置管理系统 |
| 0002 | `0002_init_access_logs.sql` | 访问日志记录系统 |
| 0004 | `0004_init_file_management.sql` | 文件管理系统核心表 |
| 0005 | `0005_add_md5_hash.sql` | MD5哈希字段 |
| 0006 | `0006_init_weibo_module.sql` | 微博模块 |
| 0007 | `0007_add_application_name.sql` | 应用名称字段 |
| 0008 | `0008_refactor_file_storage.sql` | 文件存储重构 |
| 0009 | `0009_create_blog_tables.sql` | 博客系统核心表 |
| 0010 | `0010_fix_blog_tables.sql` | 博客系统修复 |

## 🔧 自定义配置

### 修改输出文件名

**PowerShell 版本支持：**
```powershell
.\merge_migrations.ps1 -OutputFile "production_migrations.sql"
```

**批处理版本：**
编辑 `merge_migrations.bat` 文件中的 `OUTPUT_FILE` 变量。

### 过滤特定文件

如果需要合并特定文件，可以修改脚本中的文件过滤逻辑。

## 🐛 故障排除

### 常见问题

1. **找不到 migrations 目录**
   - 确保在 `server/db/` 目录下执行脚本
   - 检查 migrations 文件夹是否存在

2. **权限错误**
   - 确保脚本有读取 migrations 目录的权限
   - 确保有写入 server/db 目录的权限

3. **文件编码问题**
   - 脚本使用 UTF-8 编码
   - 如果有编码问题，可以手动调整脚本编码设置

4. **PostgreSQL 连接错误**
   - 检查数据库服务是否运行
   - 验证连接参数是否正确
   - 确保用户密码正确

### 调试技巧

1. **查看生成的文件内容**
   - 脚本提供选项可以立即查看合并结果
   - 检查文件头部分是否正确

2. **分步执行**
   - 可以先执行单个迁移脚本测试
   - 确认单个脚本无问题后再使用合并版本

3. **检查日志**
   - PostgreSQL 会提供详细的错误信息
   - 根据错误信息定位问题所在

## 📞 联系支持

如果在使用过程中遇到问题：

1. 检查 PostgreSQL 版本兼容性
2. 确认所有迁移脚本文件完整性
3. 参考 GoFrame 和 PostgreSQL 官方文档
4. 查看数据库日志获取详细错误信息

---

**最后更新**: 2025-11-03
**版本**: 1.0
**系统**: Windows (支持 PowerShell 和 CMD)