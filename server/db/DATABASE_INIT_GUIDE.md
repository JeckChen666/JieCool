# JieCool 数据库初始化指南

本文档描述了如何使用迁移脚本初始化 JieCool 项目的 PostgreSQL 数据库。

## 📋 迁移脚本概览

### 脚本列表和执行顺序

#### 迁移脚本（migrations/）- 表结构创建

| 编号 | 脚本文件 | 描述 | 创建时间 |
|------|----------|------|----------|
| 0001 | `0001_init_dynamic_configs.sql` | 🆕 动态配置管理系统 | 2025-11-03 |
| 0002 | `0002_init_access_logs.sql` | 🆕 访问日志记录系统 | 2025-11-03 |
| 0004 | `0004_init_file_management.sql` | 文件管理系统核心表 | 2025-01-27 |
| 0005 | `0005_add_md5_hash.sql` | 为files表添加MD5字段 | 2025-10-07 |
| 0006 | `0006_init_weibo_module.sql` | 微博模块 | 2025-10-11 |
| 0007 | `0007_add_application_name.sql` | 为files表添加应用名称字段 | 2025-10-26 |
| 0008 | `0008_refactor_file_storage.sql` | 文件存储重构 | 2025-10-26 |
| 0009 | `0009_create_blog_tables.sql` | 博客系统核心表 | 2025-10-28 |
| 0010 | `0010_fix_blog_tables.sql` | 🆕 修复博客系统缺失表和字段 | 2025-11-03 |

**注意**：0003 跳过（之前有编号错误，已修复为 0010）

#### 数据初始化脚本（init_data/）- 初始数据插入

| 编号 | 脚本文件 | 描述 | 创建时间 |
|------|----------|------|----------|
| 0000 | `0000_init_default_configs.sql` | 🆕 初始化默认配置项 | 2025-11-03 |

## 🚀 快速开始

### 1. 准备数据库

```sql
-- 创建数据库（如果不存在）
CREATE DATABASE JieCool;

-- 创建用户（如果不存在）
CREATE USER jiecool_user WITH PASSWORD 'your_secure_password';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE JieCool TO jiecool_user;
```

### 2. 按顺序执行脚本

#### 第一步：执行迁移脚本创建表结构

```bash
# 使用 psql 逐个执行迁移脚本（按编号顺序）
psql -h localhost -U jiecool_user -d JieCool -f migrations/0001_init_dynamic_configs.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0002_init_access_logs.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0004_init_file_management.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0005_add_md5_hash.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0006_init_weibo_module.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0007_add_application_name.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0008_refactor_file_storage.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0009_create_blog_tables.sql
psql -h localhost -U jiecool_user -d JieCool -f migrations/0010_fix_blog_tables.sql
```

#### 第二步：执行数据初始化脚本

```bash
# 在所有表创建完成后，执行数据初始化
psql -h localhost -U jiecool_user -d JieCool -f init_data/0000_init_default_configs.sql
```

# 方式二：使用批处理脚本（Windows）
# 创建 init_db.bat 并执行
```

### 3. 批处理脚本示例（Windows）

创建 `init_db.bat`：
```batch
@echo off
echo ========================================
echo JieCool 数据库初始化脚本
echo ========================================

set PSQL_PATH="C:\Program Files\PostgreSQL\16\bin\psql.exe"
set DB_HOST=localhost
set DB_USER=jiecool_user
set DB_NAME=JieCool

echo.
echo 正在初始化数据库...

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0000_init_default_configs.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0000_init_default_configs.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0001_init_dynamic_configs.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0001_init_dynamic_configs.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0002_init_access_logs.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0002_init_access_logs.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0004_init_file_management.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0004_init_file_management.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0005_add_md5_hash.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0005_add_md5_hash.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0006_init_weibo_module.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0006_init_weibo_module.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0007_add_application_name.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0007_add_application_name.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0008_refactor_file_storage.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0008_refactor_file_storage.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0009_create_blog_tables.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0009_create_blog_tables.sql 失败
    pause
    exit /b 1
)

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f 0010_fix_blog_tables.sql
if %ERRORLEVEL% NEQ 0 (
    echo 错误：执行 0010_fix_blog_tables.sql 失败
    pause
    exit /b 1
)

echo.
echo ✅ 数据库初始化完成！
echo.
echo 重要提醒：
echo 1. 请检查并更新生产环境配置（JWT密钥、域名等）
echo 2. 验证所有表是否创建成功
echo 3. 检查默认配置是否符合需求
echo.
pause
```

## 🔧 配置说明

### 初始化的配置项

执行完迁移脚本后，系统将包含以下配置类别：

#### 1. 系统配置 (`system` namespace)
- 文件清理设置
- 文件上传限制
- 缩略图配置
- 访问日志设置
- 性能配置

#### 2. 认证配置 (`auth` namespace)
- JWT 密钥和过期设置
- URL Token 配置
- 前后端域名配置
- 登录安全设置
- OAuth 配置（预留）

#### 3. 核心功能配置 (`core` namespace)
- 各功能模块开关
- 站点基本信息
- 联系方式和社交链接
- SEO 优化设置

#### 4. 博客配置 (`blog` namespace)
- 评论功能设置
- 显示和分页配置
- 时间格式设置

#### 5. 文件上传配置 (`upload` namespace)
- 文件类型限制
- 各类型文件大小限制
- 图片处理配置

#### 6. 微博配置 (`weibo` namespace)
- 字符数和图片限制
- 显示设置
- 自动刷新配置

#### 7. 每日一句配置 (`daily` namespace)
- API 设置
- 缓存配置
- 音频和颜色提取设置

### 环境特定配置

配置支持多环境：
- `default`: 默认配置
- `dev`: 开发环境覆盖配置
- `prod`: 生产环境覆盖配置

## ⚠️ 重要安全提醒

### 生产环境必须修改的配置

1. **JWT 密钥**
   ```sql
   UPDATE dynamic_configs
   SET value = 'your-secure-jwt-secret-key-here'
   WHERE namespace = 'auth' AND key = 'jwt_secret' AND env = 'prod';
   ```

2. **域名配置**
   ```sql
   UPDATE dynamic_configs
   SET value = 'https://your-domain.com'
   WHERE namespace = 'auth' AND key = 'frontend_domain' AND env = 'prod';

   UPDATE dynamic_configs
   SET value = 'https://api.your-domain.com'
   WHERE namespace = 'auth' AND key = 'backend_domain' AND env = 'prod';
   ```

3. **联系信息**
   ```sql
   UPDATE dynamic_configs
   SET value = 'your-email@domain.com'
   WHERE namespace = 'core' AND key = 'contact_email';
   ```

## 🧪 验证安装

执行以下 SQL 查询验证数据库是否正确初始化：

```sql
-- 1. 检查所有表是否创建
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. 检查配置是否初始化
SELECT COUNT(*) as config_count
FROM dynamic_configs
WHERE enabled = true;

-- 3. 检查各模块表结构
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

预期结果：
- 应该有 15 个数据表
- 应该有 50+ 条配置项
- 所有表都应该有正确的索引和约束

## 🔄 更新和维护

### 添加新配置

使用提供的函数：
```sql
-- 添加新配置
SELECT set_config(
    'your_namespace',
    'your_key'::jsonb,
    'default',
    'production',
    'string',
    '配置描述'
);
```

### 清理过期数据

```sql
-- 清理访问日志（保留90天）
SELECT cleanup_access_logs(90);

-- 清理配置历史（保留30天）
SELECT cleanup_config_history(30);
```

## 🚨 故障排除

### 常见问题

1. **权限错误**
   - 确保数据库用户有足够的权限
   - 检查数据库连接配置

2. **表已存在错误**
   - 脚本使用了 `IF NOT EXISTS`，可以安全重复执行
   - 如果仍有问题，可以手动删除表重新创建

3. **配置冲突**
   - 脚本使用了 `ON CONFLICT DO NOTHING`
   - 可以手动更新冲突的配置项

4. **性能问题**
   - 大型迁移可能需要较长时间
   - 可以分批执行脚本

### 日志检查

```sql
-- 检查迁移日志（如果有）
SELECT * FROM migration_logs ORDER BY created_at DESC;

-- 检查错误日志
SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 10;
```

## 📞 支持

如果在初始化过程中遇到问题：

1. 检查 PostgreSQL 版本（推荐 18+）
2. 确保磁盘空间充足
3. 检查网络连接（如果使用远程数据库）
4. 查看详细的错误信息
5. 参考 GoFrame 和 PostgreSQL 官方文档

---

**最后更新**: 2025-11-03
**版本**: 1.0
**数据库**: PostgreSQL 18+
**框架**: GoFrame v2.9.3