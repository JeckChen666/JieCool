# 数据库初始化数据

本目录包含用于初始化数据库数据的 SQL 脚本。

## 📁 目录结构

```
server/db/
├── migrations/          # 数据库迁移脚本（表结构创建）
│   ├── 0001_init_dynamic_configs.sql
│   ├── 0002_init_access_logs.sql
│   ├── 0004_init_file_management.sql
│   ├── ...
│   └── 0010_fix_blog_tables.sql
└── init_data/           # 数据初始化脚本（初始数据插入）
    ├── 0000_init_default_configs.sql
    └── README.md
```

## 🚀 执行顺序

### 第一步：执行迁移脚本创建表结构

```bash
# 按编号顺序执行所有迁移脚本
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

### 第二步：执行数据初始化脚本

```bash
# 在所有表创建完成后，执行数据初始化
psql -h localhost -U jiecool_user -d JieCool -f init_data/0000_init_default_configs.sql
```

## 📋 初始化数据说明

### 0000_init_default_configs.sql

初始化系统运行所需的默认配置项，包含：

- **系统配置** (`system`): 文件清理、上传限制、缓存设置等
- **认证配置** (`auth`): JWT设置、登录安全、域名配置等
- **核心配置** (`core`): 功能开关、站点信息、SEO设置等
- **博客配置** (`blog`): 评论设置、显示配置等
- **文件上传配置** (`upload`): 文件类型限制、处理设置等
- **微博配置** (`weibo`): 发布限制、显示设置等
- **每日一句配置** (`daily`): API设置、功能开关等
- **通知配置** (`notification`): 邮件、系统通知设置等

### 环境特定配置

配置支持多环境：
- `default`: 基础配置
- `dev`: 开发环境优化配置
- `prod`: 生产环境安全配置

## ⚠️ 重要提醒

1. **执行顺序必须正确**：先执行所有 migrations 创建表结构，再执行 init_data 插入数据
2. **生产环境安全**：执行完成后必须修改生产环境的安全配置（JWT密钥、域名等）
3. **配置验证**：执行完成后验证配置是否正确插入

## 🔧 完整初始化脚本示例

创建 `init_complete.bat` (Windows)：

```batch
@echo off
echo ========================================
echo JieCool 数据库完整初始化脚本
echo ========================================

set PSQL_PATH="C:\Program Files\PostgreSQL\16\bin\psql.exe"
set DB_HOST=localhost
set DB_USER=jiecool_user
set DB_NAME=JieCool

echo.
echo 第一步：创建表结构...

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0001_init_dynamic_configs.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0002_init_access_logs.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0004_init_file_management.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0005_add_md5_hash.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0006_init_weibo_module.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0007_add_application_name.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0008_refactor_file_storage.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0009_create_blog_tables.sql
if %ERRORLEVEL% NEQ 0 goto error

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f migrations/0010_fix_blog_tables.sql
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo 第二步：插入初始化数据...

%PSQL_PATH% -h %DB_HOST% -U %DB_USER% -d %DB_NAME% -f init_data/0000_init_default_configs.sql
if %ERRORLEVEL% NEQ 0 goto error

echo.
echo ✅ 数据库初始化完成！
echo.
echo 接下来请：
echo 1. 修改生产环境安全配置（JWT密钥、域名等）
echo 2. 验证所有功能是否正常
echo 3. 根据需要调整配置项
echo.
goto end

:error
echo.
echo ❌ 初始化过程中发生错误！
echo 请检查错误信息并重新执行。
echo.

:end
pause
```

## 📞 验证方法

执行完成后，运行以下 SQL 验证：

```sql
-- 检查表是否创建成功
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- 检查配置是否插入成功
SELECT namespace, COUNT(*) as config_count
FROM dynamic_configs
WHERE enabled = true
GROUP BY namespace
ORDER BY namespace;

-- 检查总配置数量
SELECT COUNT(*) as total_configs FROM dynamic_configs WHERE enabled = true;
```

预期结果：
- 15 个数据表
- 8 个配置命名空间
- 50+ 条配置项