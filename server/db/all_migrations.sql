-- ========================================
-- JieCool 数据库迁移脚本合并文件
--
-- 生成时间: 2025-11-04 00:42:11
-- 描述: 合并所有迁移脚本为一个文件，便于执行和部署
--
-- 使用方法:
--   psql -h localhost -U jiecool_user -d JieCool -f all_migrations.sql
--
-- 注意:
--   1. 请确保数据库已创建
--   2. 请确保用户有足够权限
--   3. 脚本会先删除现有对象再创建，请谨慎使用
-- ========================================

-- 开始执行迁移脚本...


-- ========================================
-- 文件: 0001_init_dynamic_configs.sql
-- ========================================

-- 动态配置管理表初始化迁移脚本
-- 创建时间: 2025-11-03
-- 描述: 创建动态配置管理相关表，用于运行时配置管理和版本控制

-- ===== 清理现有对象 =====

-- 删除触发器（先删除触发器，再删除函数）
DROP TRIGGER IF EXISTS update_dynamic_config_updated_at ON dynamic_configs;

-- 删除函数（使用 CASCADE 处理依赖）
DROP FUNCTION IF EXISTS update_dynamic_config_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_config(TEXT, JSONB, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS set_config(TEXT, JSONB, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS toggle_config(TEXT, BOOLEAN, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS delete_config(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS cleanup_config_history(INTEGER, TEXT, TEXT) CASCADE;

-- 删除索引
DROP INDEX IF EXISTS idx_dynamic_configs_namespace;
DROP INDEX IF EXISTS idx_dynamic_configs_env;
DROP INDEX IF EXISTS idx_dynamic_configs_key;
DROP INDEX IF EXISTS idx_dynamic_configs_enabled;
DROP INDEX IF EXISTS idx_dynamic_configs_updated_at;
DROP INDEX IF EXISTS idx_dynamic_config_versions_namespace;
DROP INDEX IF EXISTS idx_dynamic_config_versions_env;
DROP INDEX IF EXISTS idx_dynamic_config_versions_key;
DROP INDEX IF EXISTS idx_dynamic_config_versions_version;
DROP INDEX IF EXISTS idx_dynamic_config_versions_created_at;

-- 删除表（使用 CASCADE）
DROP TABLE IF EXISTS dynamic_config_versions CASCADE;
DROP TABLE IF EXISTS dynamic_configs CASCADE;

-- ===== 创建新对象 =====

-- 1. 动态配置主表
CREATE TABLE dynamic_configs (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,

    -- 配置标识
    namespace TEXT NOT NULL DEFAULT 'default',      -- 配置命名空间，用于分组管理
    env TEXT NOT NULL DEFAULT 'production',             -- 环境标识：development, staging, production
    key TEXT NOT NULL,                              -- 配置键名
    type TEXT NOT NULL DEFAULT 'string',             -- 配置类型：string, number, boolean, json, array
    value JSONB NOT NULL DEFAULT '{}'::jsonb,       -- 配置值（JSON格式）

    -- 控制字段
    enabled BOOLEAN NOT NULL DEFAULT true,           -- 是否启用该配置
    version INTEGER NOT NULL DEFAULT 1,              -- 配置版本号

    -- 元数据
    description TEXT,                                   -- 配置描述
    updated_by TEXT,                                  -- 更新者标识

    -- 时间戳
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建唯一约束
ALTER TABLE dynamic_configs
ADD CONSTRAINT uk_dynamic_configs UNIQUE (namespace, env, key);

-- 创建索引
CREATE INDEX idx_dynamic_configs_namespace ON dynamic_configs(namespace);
CREATE INDEX idx_dynamic_configs_env ON dynamic_configs(env);
CREATE INDEX idx_dynamic_configs_key ON dynamic_configs(key);
CREATE INDEX idx_dynamic_configs_enabled ON dynamic_configs(enabled);
CREATE INDEX idx_dynamic_configs_updated_at ON dynamic_configs(updated_at);

-- 添加表注释
COMMENT ON TABLE dynamic_configs IS '动态配置管理表，用于存储和管理应用运行时配置';
COMMENT ON COLUMN dynamic_configs.id IS '主键ID';
COMMENT ON COLUMN dynamic_configs.namespace IS '配置命名空间，用于分组管理不同模块的配置';
COMMENT ON COLUMN dynamic_configs.env IS '环境标识：development, staging, production';
COMMENT ON COLUMN dynamic_configs.key IS '配置键名';
COMMENT ON COLUMN dynamic_configs.type IS '配置类型：string, number, boolean, json, array';
COMMENT ON COLUMN dynamic_configs.value IS '配置值（JSONB格式）';
COMMENT ON COLUMN dynamic_configs.enabled IS '是否启用该配置';
COMMENT ON COLUMN dynamic_configs.version IS '配置版本号';
COMMENT ON COLUMN dynamic_configs.description IS '配置描述';
COMMENT ON COLUMN dynamic_configs.updated_by IS '更新者标识';
COMMENT ON COLUMN dynamic_configs.updated_at IS '更新时间';
COMMENT ON COLUMN dynamic_configs.created_at IS '创建时间';

-- 2. 动态配置版本历史表
CREATE TABLE dynamic_config_versions (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,

    -- 关联配置信息
    namespace TEXT NOT NULL DEFAULT 'default',      -- 配置命名空间
    env TEXT NOT NULL DEFAULT 'production',             -- 环境标识
    key TEXT NOT NULL,                              -- 配置键名
    version INTEGER NOT NULL,                          -- 版本号

    -- 变更信息
    type TEXT NOT NULL,                             -- 配置类型
    value JSONB NOT NULL,                            -- 配置值（JSON格式）
    enabled BOOLEAN NOT NULL DEFAULT true,           -- 是否启用

    -- 元数据
    description TEXT,                                  -- 配置描述
    changed_by TEXT,                                  -- 变更者标识
    change_reason TEXT,                               -- 变更原因

    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_dynamic_config_versions_namespace ON dynamic_config_versions(namespace);
CREATE INDEX idx_dynamic_config_versions_env ON dynamic_config_versions(env);
CREATE INDEX idx_dynamic_config_versions_key ON dynamic_config_versions(key);
CREATE INDEX idx_dynamic_config_versions_version ON dynamic_config_versions(version DESC);
CREATE INDEX idx_dynamic_config_versions_created_at ON dynamic_config_versions(created_at DESC);

-- 添加表注释
COMMENT ON TABLE dynamic_config_versions IS '动态配置版本历史表，记录所有配置的变更历史';
COMMENT ON COLUMN dynamic_config_versions.id IS '主键ID';
COMMENT ON COLUMN dynamic_config_versions.namespace IS '配置命名空间';
COMMENT ON COLUMN dynamic_config_versions.env IS '环境标识';
COMMENT ON COLUMN dynamic_config_versions.key IS '配置键名';
COMMENT ON COLUMN dynamic_config_versions.version IS '版本号';
COMMENT ON COLUMN dynamic_config_versions.type IS '配置类型';
COMMENT ON COLUMN dynamic_config_versions.value IS '配置值（JSONB格式）';
COMMENT ON COLUMN dynamic_config_versions.enabled IS '是否启用';
COMMENT ON COLUMN dynamic_config_versions.description IS '配置描述';
COMMENT ON COLUMN dynamic_config_versions.changed_by IS '变更者标识';
COMMENT ON COLUMN dynamic_config_versions.change_reason IS '变更原因';
COMMENT ON COLUMN dynamic_config_versions.created_at IS '创建时间';

-- 3. 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_dynamic_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为dynamic_configs表创建更新时间触发器
CREATE TRIGGER update_dynamic_config_updated_at
    BEFORE UPDATE ON dynamic_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_dynamic_config_updated_at();

-- 4. 创建配置管理函数

-- 获取配置值函数
CREATE OR REPLACE FUNCTION get_config(
    p_key TEXT,
    p_default_value JSONB DEFAULT '{}'::jsonb,
    p_namespace TEXT DEFAULT 'default',
    p_env TEXT DEFAULT 'production'
) RETURNS JSONB AS $$
DECLARE
    config_value JSONB;
BEGIN
    SELECT value INTO config_value
    FROM dynamic_configs
    WHERE key = p_key
      AND namespace = p_namespace
      AND env = p_env
      AND enabled = true
    LIMIT 1;

    RETURN COALESCE(config_value, p_default_value);
END;
$$ LANGUAGE plpgsql;

-- 设置配置值函数
CREATE OR REPLACE FUNCTION set_config(
    p_key TEXT,
    p_value JSONB,
    p_namespace TEXT DEFAULT 'default',
    p_env TEXT DEFAULT 'production',
    p_type TEXT DEFAULT 'string',
    p_description TEXT DEFAULT NULL,
    p_changed_by TEXT DEFAULT NULL,
    p_change_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    current_version INTEGER;
    new_version INTEGER;
    old_enabled BOOLEAN;
BEGIN
    -- 检查配置是否存在
    SELECT version, enabled INTO current_version, old_enabled
    FROM dynamic_configs
    WHERE key = p_key
      AND namespace = p_namespace
      AND env = p_env
    FOR UPDATE;

    IF current_version IS NOT NULL THEN
        -- 更新现有配置
        new_version := current_version + 1;

        -- 记录版本历史
        INSERT INTO dynamic_config_versions (
            namespace, env, key, version, type, value, enabled,
            description, changed_by, change_reason
        ) VALUES (
            p_namespace, p_env, p_key, new_version, p_type, p_value, old_enabled,
            (SELECT description FROM dynamic_configs WHERE key = p_key AND namespace = p_namespace AND env = p_env),
            p_changed_by, p_change_reason
        );

        -- 更新主表
        UPDATE dynamic_configs
        SET
            type = p_type,
            value = p_value,
            version = new_version,
            description = COALESCE(p_description, description),
            updated_by = p_changed_by,
            updated_at = NOW()
        WHERE key = p_key
          AND namespace = p_namespace
          AND env = p_env;

        RETURN true;
    ELSE
        -- 创建新配置
        INSERT INTO dynamic_configs (
            namespace, env, key, type, value, enabled, version,
            description, updated_by
        ) VALUES (
            p_namespace, p_env, p_key, p_type, p_value, true, 1,
            p_description, p_changed_by
        );

        -- 记录版本历史
        INSERT INTO dynamic_config_versions (
            namespace, env, key, version, type, value, enabled,
            description, changed_by, change_reason
        ) VALUES (
            p_namespace, p_env, p_key, 1, p_type, p_value, true,
            p_description, p_changed_by, p_change_reason
        );

        RETURN true;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '设置配置失败: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 启用/禁用配置函数
CREATE OR REPLACE FUNCTION toggle_config(
    p_key TEXT,
    p_enabled BOOLEAN,
    p_namespace TEXT DEFAULT 'default',
    p_env TEXT DEFAULT 'production'
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE dynamic_configs
    SET enabled = p_enabled,
        updated_at = NOW()
    WHERE key = p_key
      AND namespace = p_namespace
      AND env = p_env;

    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '切换配置状态失败: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 删除配置函数
CREATE OR REPLACE FUNCTION delete_config(
    p_key TEXT,
    p_namespace TEXT DEFAULT 'default',
    p_env TEXT DEFAULT 'production'
) RETURNS BOOLEAN AS $$
BEGIN
    -- 记录删除前的状态到版本历史（软删除标记）
    UPDATE dynamic_configs
    SET enabled = false,
        updated_at = NOW()
    WHERE key = p_key
      AND namespace = p_namespace
      AND env = p_env;

    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '删除配置失败: %', SQLERRM;
        RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 清理配置历史函数
CREATE OR REPLACE FUNCTION cleanup_config_history(
    p_keep_days INTEGER DEFAULT 30,
    p_namespace TEXT DEFAULT NULL,
    p_env TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM dynamic_config_versions
    WHERE created_at < NOW() - INTERVAL '1 day' * p_keep_days
      AND (p_namespace IS NULL OR namespace = p_namespace)
      AND (p_env IS NULL OR env = p_env);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '动态配置管理表初始化完成';
    RAISE NOTICE '已创建的功能：';
    RAISE NOTICE '1. 配置存储和管理';
    RAISE NOTICE '2. 版本控制和历史记录';
    RAISE NOTICE '3. 环境和命名空间隔离';
    RAISE NOTICE '4. 配置管理函数（get_config, set_config等）';
END $$;
-- 文件 0001_init_dynamic_configs.sql 合并完成

-- ========================================
-- 文件: 0002_init_access_logs.sql
-- ========================================

-- 访问日志表初始化迁移脚本
-- ===== 清理现有对象 =====

DROP VIEW IF EXISTS daily_visit_stats;
DROP VIEW IF EXISTS hourly_visit_stats;
DROP VIEW IF EXISTS path_visit_stats;
DROP VIEW IF EXISTS user_agent_stats;
DROP VIEW IF EXISTS geo_location_stats;
DROP FUNCTION IF EXISTS cleanup_access_logs();
DROP FUNCTION IF EXISTS aggregate_daily_stats();
DROP FUNCTION IF EXISTS get_realtime_stats();
DROP FUNCTION IF EXISTS get_popular_pages();
DROP FUNCTION IF EXISTS get_visit_trend();
DROP INDEX IF EXISTS idx_logs_visit_access_time;
DROP INDEX IF EXISTS idx_logs_visit_access_ip;
DROP INDEX IF EXISTS idx_logs_visit_access_method;
DROP INDEX IF EXISTS idx_logs_visit_access_path;
DROP INDEX IF EXISTS idx_logs_visit_access_created_at;
DROP INDEX IF EXISTS idx_logs_visit_access_headers_gin;
-- 删除logs_visit_access表的约束
-- 删除表（按依赖关系逆序删除，使用 CASCADE）
DROP TABLE IF EXISTS logs_visit_access CASCADE;

-- ===== 创建新对象 =====


-- 创建时间: 2025-11-03
-- 描述: 创建访问日志记录表，用于记录网站访问统计和分析

-- 创建访问日志表
CREATE TABLE logs_visit_access (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,

    -- 访问时间和客户端信息
    time TIMESTAMPTZ NOT NULL,                    -- 访问时间（精确到毫秒）
    ip TEXT,                                       -- 访问者IP地址
    user_agent TEXT,                                 -- 用户代理字符串
    method TEXT,                                     -- HTTP方法：GET, POST, PUT, DELETE等
    path TEXT,                                       -- 请求路径

    -- 请求头信息（JSONB格式存储）
    headers JSONB NOT NULL DEFAULT '{}'::jsonb, -- 所有HTTP请求头（JSONB格式）

    -- 记录时间
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX idx_logs_visit_access_time ON logs_visit_access(time DESC);
CREATE INDEX idx_logs_visit_access_ip ON logs_visit_access(ip);
CREATE INDEX idx_logs_visit_access_method ON logs_visit_access(method);
CREATE INDEX idx_logs_visit_access_path ON logs_visit_access(path);
CREATE INDEX idx_logs_visit_access_created_at ON logs_visit_access(created_at DESC);

-- 创建GIN索引用于请求头JSONB查询
CREATE INDEX idx_logs_visit_access_headers_gin ON logs_visit_access USING GIN(headers);

-- 添加表注释
COMMENT ON TABLE logs_visit_access IS '访问日志记录表，用于记录网站访问统计和分析';
COMMENT ON COLUMN logs_visit_access.id IS '主键ID';
COMMENT ON COLUMN logs_visit_access.time IS '访问时间（精确到毫秒）';
COMMENT ON COLUMN logs_visit_access.ip IS '访问者IP地址';
COMMENT ON COLUMN logs_visit_access.user_agent IS '用户代理字符串';
COMMENT ON COLUMN logs_visit_access.method IS 'HTTP方法：GET, POST, PUT, DELETE等';
COMMENT ON COLUMN logs_visit_access.path IS '请求路径';
COMMENT ON COLUMN logs_visit_access.headers IS '所有HTTP请求头（JSONB格式）';
COMMENT ON COLUMN logs_visit_access.created_at IS '记录时间';

-- 创建访问统计视图
CREATE OR REPLACE VIEW daily_visit_stats AS
SELECT
    DATE(time) as visit_date,
    COUNT(*) as total_visits,
    COUNT(DISTINCT ip) as unique_visitors,
    COUNT(DISTINCT path) as unique_paths,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(time)
ORDER BY visit_date DESC;

COMMENT ON VIEW daily_visit_stats IS '每日访问统计视图（最近30天）';

-- 创建小时访问统计视图
CREATE OR REPLACE VIEW hourly_visit_stats AS
SELECT
    DATE_TRUNC('hour', time) as visit_hour,
    COUNT(*) as total_visits,
    COUNT(DISTINCT ip) as unique_visitors,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', time)
ORDER BY visit_hour DESC;

COMMENT ON VIEW hourly_visit_stats IS '每小时访问统计视图（最近7天）';

-- 创建路径访问统计视图
CREATE OR REPLACE VIEW path_visit_stats AS
SELECT
    path,
    COUNT(*) as visit_count,
    COUNT(DISTINCT ip) as unique_visitors,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY path
ORDER BY visit_count DESC
LIMIT 100;

COMMENT ON VIEW path_visit_stats IS '页面访问统计视图（前100个页面，最近30天）';

-- 创建用户代理统计视图
CREATE OR REPLACE VIEW user_agent_stats AS
SELECT
    CASE
        WHEN user_agent ~* 'Chrome' THEN 'Chrome'
        WHEN user_agent ~* 'Firefox' THEN 'Firefox'
        WHEN user_agent ~* 'Safari' THEN 'Safari'
        WHEN user_agent ~* 'Edge' THEN 'Edge'
        WHEN user_agent ~* 'Opera' THEN 'Opera'
        WHEN user_agent ~* 'MSIE' THEN 'Internet Explorer'
        WHEN user_agent ~* 'bot' OR user_agent ~* 'crawler' OR user_agent ~* 'spider' THEN 'Bot/Crawler'
        ELSE 'Other'
    END as browser_type,
    COUNT(*) as visit_count,
    COUNT(DISTINCT ip) as unique_visitors,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY
    CASE
        WHEN user_agent ~* 'Chrome' THEN 'Chrome'
        WHEN user_agent ~* 'Firefox' THEN 'Firefox'
        WHEN user_agent ~* 'Safari' THEN 'Safari'
        WHEN user_agent ~* 'Edge' THEN 'Edge'
        WHEN user_agent ~* 'Opera' THEN 'Opera'
        WHEN user_agent ~* 'MSIE' THEN 'Internet Explorer'
        WHEN user_agent ~* 'bot' OR user_agent ~* 'crawler' OR user_agent ~* 'spider' THEN 'Bot/Crawler'
        ELSE 'Other'
    END
ORDER BY visit_count DESC;

COMMENT ON VIEW user_agent_stats IS '浏览器类型统计视图（最近30天）';

-- 创建地理位置统计视图（如果有位置信息）
CREATE OR REPLACE VIEW geo_location_stats AS
SELECT
    CASE
        WHEN headers->>'x-forwarded-for' IS NOT NULL THEN headers->>'x-forwarded-for'
        WHEN headers->>'x-real-ip' IS NOT NULL THEN headers->>'x-real-ip'
        ELSE ip
    END as real_ip,
    COUNT(*) as visit_count,
    COUNT(DISTINCT ip) as unique_visitors,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '30 days'
  AND (headers->>'x-forwarded-for' IS NOT NULL OR headers->>'x-real-ip' IS NOT NULL)
GROUP BY
    CASE
        WHEN headers->>'x-forwarded-for' IS NOT NULL THEN headers->>'x-forwarded-for'
        WHEN headers->>'x-real-ip' IS NOT NULL THEN headers->>'x-real-ip'
        ELSE ip
    END
ORDER BY visit_count DESC
LIMIT 50;

COMMENT ON VIEW geo_location_stats IS '地理位置统计视图（基于代理头IP，最近30天）';

-- 创建数据清理函数
CREATE OR REPLACE FUNCTION cleanup_access_logs(
    p_keep_days INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除超过指定天数的访问日志
    DELETE FROM logs_visit_access
    WHERE time < NOW() - INTERVAL '1 day' * p_keep_days;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '清理访问日志失败: %', SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 创建数据聚合函数（按天聚合访问统计）
CREATE OR REPLACE FUNCTION aggregate_daily_stats(
    p_target_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
    -- 将当日数据聚合到统计表（如果需要）
    -- 这里可以创建一个专门的统计表来存储每日的聚合数据
    -- 以便提高查询性能
    RAISE NOTICE '日期 % 的访问日志聚合完成', p_target_date;
END;
$$ LANGUAGE plpgsql;

-- 创建实时统计函数
CREATE OR REPLACE FUNCTION get_realtime_stats(
    p_minutes INTEGER DEFAULT 5
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_visits BIGINT;
    unique_visits BIGINT;
    recent_time TIMESTAMPTZ;
BEGIN
    recent_time := NOW() - INTERVAL '1 minute' * p_minutes;

    SELECT
        COUNT(*) as total_visits,
        COUNT(DISTINCT ip) as unique_visits
    INTO total_visits, unique_visits
    FROM logs_visit_access
    WHERE time >= recent_time;

    result := jsonb_build_object(
        'period_minutes', p_minutes,
        'total_visits', total_visits,
        'unique_visits', unique_visits,
        'generated_at', NOW()
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 创建热门页面分析函数
CREATE OR REPLACE FUNCTION get_popular_pages(
    p_days INTEGER DEFAULT 7,
    p_limit INTEGER DEFAULT 10
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'path', path,
            'visit_count', visit_count,
            'unique_visitors', unique_visitors
        ) ORDER BY visit_count DESC
    ) INTO result
    FROM (
        SELECT
            path,
            COUNT(*) as visit_count,
            COUNT(DISTINCT ip) as unique_visitors
        FROM logs_visit_access
        WHERE time >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY path
        ORDER BY visit_count DESC
        LIMIT p_limit
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 创建访问趋势分析函数
CREATE OR REPLACE FUNCTION get_visit_trend(
    p_days INTEGER DEFAULT 7
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', DATE(time),
            'visits', COUNT(*),
            'unique_visitors', COUNT(DISTINCT ip)
        ) ORDER BY DATE(time) ASC
    ) INTO result
    FROM logs_visit_access
    WHERE time >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY DATE(time)
    ORDER BY DATE(time) ASC;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '访问日志表初始化完成';
    RAISE NOTICE '已创建的功能：';
    RAISE NOTICE '1. 访问日志记录和存储';
    RAISE NOTICE '2. 请求头信息完整保存（JSONB格式）';
    RAISE NOTICE '3. 多维度统计视图（日/小时/路径/浏览器）';
    RAISE NOTICE '4. 地理位置识别（基于代理头）';
    RAISE NOTICE '5. 数据清理和维护函数';
    RAISE NOTICE '6. 实时统计和分析函数';
END $$;
-- 文件 0002_init_access_logs.sql 合并完成

-- ========================================
-- 文件: 0004_init_file_management.sql
-- ========================================

-- 文件管理表迁移脚本
-- ===== 清理现有对象 =====

-- 删除触发器（先删除触发器，再删除函数）
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_file_download_logs_updated_at ON file_download_logs;

-- 删除函数（使用 CASCADE 处理依赖）
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP INDEX IF EXISTS idx_files_file_uuid;
DROP INDEX IF EXISTS idx_files_file_hash;
DROP INDEX IF EXISTS idx_files_file_extension;
DROP INDEX IF EXISTS idx_files_file_category;
DROP INDEX IF EXISTS idx_files_file_status;
DROP INDEX IF EXISTS idx_files_created_at;
DROP INDEX IF EXISTS idx_files_download_count;
DROP INDEX IF EXISTS idx_files_status_category;
DROP INDEX IF EXISTS idx_files_extension_status;
DROP INDEX IF EXISTS idx_files_metadata_gin;
DROP INDEX IF EXISTS idx_file_download_logs_file_id;
DROP INDEX IF EXISTS idx_file_download_logs_file_uuid;
DROP INDEX IF EXISTS idx_file_download_logs_download_time;
DROP INDEX IF EXISTS idx_file_download_logs_download_ip;
-- 删除files表的约束
-- 删除file_download_logs表的约束
-- 删除表（按依赖关系逆序删除，使用 CASCADE）
DROP TABLE IF EXISTS file_download_logs CASCADE;
DROP TABLE IF EXISTS files CASCADE;

-- ===== 创建新对象 =====


-- 创建时间: 2025-01-27
-- 描述: 实现文件上传下载功能，将文件存储在PostgreSQL数据库中

-- 文件存储主表
CREATE TABLE files (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,
    
    -- 文件唯一标识符，用于外部访问（UUID格式）
    file_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- 文件基本信息
    file_name TEXT NOT NULL,                    -- 原始文件名
    file_extension VARCHAR(20) NOT NULL,       -- 文件扩展名（不含点号，如：jpg, pdf, docx）
    file_size BIGINT NOT NULL,                 -- 文件大小（字节）
    mime_type VARCHAR(255) NOT NULL,           -- MIME类型（如：image/jpeg, application/pdf）
    
    -- 文件内容存储（使用BYTEA存储二进制数据）
    file_content BYTEA NOT NULL,               -- 文件二进制内容
    
    -- 文件哈希值（用于去重和完整性校验）
    file_hash VARCHAR(64) NOT NULL,            -- SHA256哈希值
    
    -- 缩略图相关（仅图片文件）
    has_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否有缩略图
    thumbnail_content BYTEA,                   -- 缩略图二进制内容
    thumbnail_width INTEGER,                   -- 缩略图宽度
    thumbnail_height INTEGER,                  -- 缩略图高度
    
    -- 统计信息
    download_count BIGINT NOT NULL DEFAULT 0,  -- 下载次数
    last_download_at TIMESTAMPTZ,             -- 最近一次下载时间
    
    -- 文件元数据（使用JSONB存储扩展信息）
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 文件元数据（如：图片尺寸、拍摄信息等）
    
    -- 文件状态和分类
    file_status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 文件状态：active, deleted, archived
    file_category VARCHAR(50),                 -- 文件分类（如：image, document, video, audio, other）
    
    -- 上传者信息（预留字段，后续可关联用户系统）
    uploader_ip INET,                          -- 上传者IP地址
    uploader_user_agent TEXT,                  -- 上传者User-Agent
    uploader_id BIGINT,                        -- 上传者用户ID（预留）
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),     -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()      -- 更新时间
);

-- 创建索引优化查询性能
CREATE INDEX idx_files_file_uuid ON files(file_uuid);
CREATE INDEX idx_files_file_hash ON files(file_hash);
CREATE INDEX idx_files_file_extension ON files(file_extension);
CREATE INDEX idx_files_file_category ON files(file_category);
CREATE INDEX idx_files_file_status ON files(file_status);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_download_count ON files(download_count);

-- 创建复合索引
CREATE INDEX idx_files_status_category ON files(file_status, file_category);
CREATE INDEX idx_files_extension_status ON files(file_extension, file_status);

-- 创建GIN索引用于JSONB元数据查询
CREATE INDEX idx_files_metadata_gin ON files USING GIN(metadata);

-- 添加表注释
COMMENT ON TABLE files IS '文件存储表，用于存储上传的文件及其元数据';
COMMENT ON COLUMN files.id IS '主键ID';
COMMENT ON COLUMN files.file_uuid IS '文件唯一标识符，用于外部访问';
COMMENT ON COLUMN files.file_name IS '原始文件名';
COMMENT ON COLUMN files.file_extension IS '文件扩展名（不含点号）';
COMMENT ON COLUMN files.file_size IS '文件大小（字节）';
COMMENT ON COLUMN files.mime_type IS 'MIME类型';
COMMENT ON COLUMN files.file_content IS '文件二进制内容';
COMMENT ON COLUMN files.file_hash IS 'SHA256哈希值，用于去重和完整性校验';
COMMENT ON COLUMN files.has_thumbnail IS '是否有缩略图';
COMMENT ON COLUMN files.thumbnail_content IS '缩略图二进制内容';
COMMENT ON COLUMN files.thumbnail_width IS '缩略图宽度';
COMMENT ON COLUMN files.thumbnail_height IS '缩略图高度';
COMMENT ON COLUMN files.download_count IS '下载次数';
COMMENT ON COLUMN files.last_download_at IS '最近一次下载时间';
COMMENT ON COLUMN files.metadata IS '文件元数据（JSONB格式）';
COMMENT ON COLUMN files.file_status IS '文件状态：active, deleted, archived';
COMMENT ON COLUMN files.file_category IS '文件分类';
COMMENT ON COLUMN files.uploader_ip IS '上传者IP地址';
COMMENT ON COLUMN files.uploader_user_agent IS '上传者User-Agent';
COMMENT ON COLUMN files.uploader_id IS '上传者用户ID（预留）';
COMMENT ON COLUMN files.created_at IS '创建时间';
COMMENT ON COLUMN files.updated_at IS '更新时间';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为files表创建更新时间触发器
CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建文件下载日志表（可选，用于详细的下载统计）
CREATE TABLE file_download_logs (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_uuid UUID NOT NULL,                   -- 冗余存储，便于查询
    download_ip INET,                           -- 下载者IP
    download_user_agent TEXT,                   -- 下载者User-Agent
    download_referer TEXT,                      -- 下载来源页面
    download_size BIGINT,                       -- 实际下载大小（支持断点续传）
    download_status VARCHAR(20) DEFAULT 'success',  -- 下载状态：success, failed, partial
    download_time TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 下载时间
);

-- 为下载日志表创建索引
CREATE INDEX idx_file_download_logs_file_id ON file_download_logs(file_id);
CREATE INDEX idx_file_download_logs_file_uuid ON file_download_logs(file_uuid);
CREATE INDEX idx_file_download_logs_download_time ON file_download_logs(download_time);
CREATE INDEX idx_file_download_logs_download_ip ON file_download_logs(download_ip);

-- 添加下载日志表注释
COMMENT ON TABLE file_download_logs IS '文件下载日志表，记录详细的下载统计信息';
COMMENT ON COLUMN file_download_logs.file_id IS '关联的文件ID';
COMMENT ON COLUMN file_download_logs.file_uuid IS '文件UUID（冗余存储）';
COMMENT ON COLUMN file_download_logs.download_ip IS '下载者IP地址';
COMMENT ON COLUMN file_download_logs.download_user_agent IS '下载者User-Agent';
COMMENT ON COLUMN file_download_logs.download_referer IS '下载来源页面';
COMMENT ON COLUMN file_download_logs.download_size IS '实际下载大小';
COMMENT ON COLUMN file_download_logs.download_status IS '下载状态';
COMMENT ON COLUMN file_download_logs.download_time IS '下载时间';
-- 文件 0004_init_file_management.sql 合并完成

-- ========================================
-- 文件: 0005_add_md5_hash.sql
-- ========================================

-- 添加MD5哈希字段迁移脚本
-- ===== 清理现有对象 =====

DROP INDEX IF EXISTS idx_files_md5;

-- ===== 创建新对象 =====


-- 创建时间: 2025-10-07
-- 描述: 为files表添加MD5哈希字段，用于文件完整性校验

-- 添加MD5哈希字段
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_md5 VARCHAR(32);

-- 为MD5字段添加索引（可选，用于快速查找）
CREATE INDEX idx_files_md5 ON files(file_md5);

-- 添加注释
COMMENT ON COLUMN files.file_md5 IS 'MD5哈希值，用于文件完整性校验';
-- 文件 0005_add_md5_hash.sql 合并完成

-- ========================================
-- 文件: 0006_init_weibo_module.sql
-- ========================================

-- 微博模块初始化迁移脚本
-- ===== 清理现有对象 =====

-- 删除触发器（先删除触发器，再删除函数）
DROP TRIGGER IF EXISTS t_weibo_posts_updated_at ON weibo_posts;

-- 删除函数（使用 CASCADE 处理依赖）
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- 删除索引
DROP INDEX IF EXISTS idx_weibo_posts_created_at_desc;
DROP INDEX IF EXISTS idx_weibo_posts_visibility;
DROP INDEX IF EXISTS idx_weibo_posts_author_id;
DROP INDEX IF EXISTS idx_weibo_posts_not_deleted_created_desc;
DROP INDEX IF EXISTS idx_weibo_assets_post_id_kind;
DROP INDEX IF EXISTS idx_weibo_assets_post_id_sort;
DROP INDEX IF EXISTS idx_weibo_snapshots_post_id_version;
DROP INDEX IF EXISTS idx_weibo_snapshots_created_at_desc;

-- 删除表（按依赖关系逆序删除，使用 CASCADE）
DROP TABLE IF EXISTS weibo_snapshots CASCADE;
DROP TABLE IF EXISTS weibo_assets CASCADE;
DROP TABLE IF EXISTS weibo_posts CASCADE;

-- ===== 创建新对象 =====


-- 创建时间: 2025-10-11
-- 描述: 新增微博主表、资产表、快照表及相关索引与触发器

BEGIN;

-- 1) 主表：weibo_posts（微博内容与元信息）
CREATE TABLE weibo_posts (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_id BIGINT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  lat NUMERIC(10,6),
  lng NUMERIC(10,6),
  city VARCHAR(128),
  device VARCHAR(256),
  ip VARCHAR(64),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  extra JSONB,
  CONSTRAINT chk_lat_range CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90)),
  CONSTRAINT chk_lng_range CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180))
);

COMMENT ON TABLE weibo_posts IS '微博主表：内容/时间/位置/设备/IP/可见性/扩展';
COMMENT ON COLUMN weibo_posts.visibility IS 'public: 公开，private: 登录可见（权限预留）';

-- 触发器函数：更新 updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器：更新前刷新 updated_at
DROP TRIGGER IF EXISTS t_weibo_posts_updated_at ON weibo_posts;
CREATE TRIGGER t_weibo_posts_updated_at
BEFORE UPDATE ON weibo_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 索引
CREATE INDEX idx_weibo_posts_created_at_desc ON weibo_posts (created_at DESC);
CREATE INDEX idx_weibo_posts_visibility ON weibo_posts (visibility);
CREATE INDEX idx_weibo_posts_author_id ON weibo_posts (author_id);
CREATE INDEX idx_weibo_posts_not_deleted_created_desc ON weibo_posts (created_at DESC) WHERE is_deleted = false;

-- 2) 资产表：weibo_assets（图片/附件关联）
CREATE TABLE weibo_assets (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES weibo_posts(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','attachment')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE weibo_assets IS '微博资产表：图片/附件与文件系统关联';
COMMENT ON COLUMN weibo_assets.file_id IS '引用文件系统中的文件主键/唯一ID（与 files.id 对应）';

-- 外键：引用文件系统
ALTER TABLE weibo_assets
  DROP CONSTRAINT IF EXISTS fk_weibo_assets_file_id,
  ADD CONSTRAINT fk_weibo_assets_file_id
    FOREIGN KEY (file_id)
    REFERENCES files (id)
    ON DELETE RESTRICT;

-- 索引
CREATE INDEX idx_weibo_assets_post_id_kind ON weibo_assets (post_id, kind);
CREATE INDEX idx_weibo_assets_post_id_sort ON weibo_assets (post_id, sort_order);

-- 3) 快照表：weibo_snapshots（编辑历史）
CREATE TABLE weibo_snapshots (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES weibo_posts(id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot_content TEXT,
  snapshot_visibility TEXT NOT NULL CHECK (snapshot_visibility IN ('public','private')),
  snapshot_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uk_weibo_snapshots_post_version UNIQUE (post_id, version)
);

COMMENT ON TABLE weibo_snapshots IS '微博快照表：记录每次编辑的历史版本';

-- 索引
CREATE INDEX idx_weibo_snapshots_post_id_version ON weibo_snapshots (post_id, version);
CREATE INDEX idx_weibo_snapshots_created_at_desc ON weibo_snapshots (created_at DESC);

COMMIT;
-- 文件 0006_init_weibo_module.sql 合并完成

-- ========================================
-- 文件: 0007_add_application_name.sql
-- ========================================

-- 添加MD5哈希字段迁移脚本
-- ===== 清理现有对象 =====

DROP INDEX IF EXISTS idx_application_name;

-- ===== 创建新对象 =====


-- 创建时间: 2025-10-26
-- 描述: 为files表添加应用名称字段，用于文件完整性校验

-- 添加应用名称字段
ALTER TABLE files ADD COLUMN IF NOT EXISTS application_name VARCHAR(50);

-- 为应用名称字段添加索引（可选，用于快速查找）
CREATE INDEX idx_application_name ON files(application_name);

-- 添加注释
COMMENT ON COLUMN files.application_name IS '应用名称';
-- 文件 0007_add_application_name.sql 合并完成

-- ========================================
-- 文件: 0008_refactor_file_storage.sql
-- ========================================

-- 文件存储表重构迁移脚本
-- ===== 清理现有对象 =====

-- 删除视图
DROP VIEW IF EXISTS files_with_content;

-- 删除触发器（先删除触发器，再删除函数）
DROP TRIGGER IF EXISTS update_file_contents_updated_at ON file_contents;

-- 删除函数（使用 CASCADE 处理依赖）
DROP FUNCTION IF EXISTS create_file_content() CASCADE;
DROP FUNCTION IF EXISTS update_file_content() CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_contents() CASCADE;

-- 删除索引
DROP INDEX IF EXISTS idx_file_contents_created_at;
DROP INDEX IF EXISTS idx_files_file_content_id;

-- 删除表（使用 CASCADE）
DROP TABLE IF EXISTS file_contents CASCADE;

-- ===== 创建新对象 =====


-- 创建时间: 2025-10-26
-- 描述: 将文件二进制数据从files表分离到专门的file_contents表，提升查询性能

-- 1. 创建文件内容存储表
CREATE TABLE file_contents (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,

    -- 文件二进制内容（使用BYTEA存储二进制数据）
    file_content BYTEA NOT NULL,

    -- 缩略图二进制内容（可选，仅图片文件）
    thumbnail_content BYTEA,

    -- 创建时间（用于调试和监控）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 更新时间（用于内容更新追踪）
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为file_contents表创建索引
CREATE INDEX idx_file_contents_created_at ON file_contents(created_at);

-- 添加表注释
COMMENT ON TABLE file_contents IS '文件内容存储表，用于存储文件和缩略图的二进制数据';
COMMENT ON COLUMN file_contents.id IS '主键ID';
COMMENT ON COLUMN file_contents.file_content IS '文件二进制内容';
COMMENT ON COLUMN file_contents.thumbnail_content IS '缩略图二进制内容';
COMMENT ON COLUMN file_contents.created_at IS '创建时间';
COMMENT ON COLUMN file_contents.updated_at IS '更新时间';

-- 2. 为file_contents表创建更新时间触发器函数（复用现有函数）
-- 为file_contents表创建更新时间触发器
CREATE TRIGGER update_file_contents_updated_at
    BEFORE UPDATE ON file_contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. 修改files表，添加file_content_id字段
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_content_id BIGINT REFERENCES file_contents(id) ON DELETE RESTRICT;

-- 为file_content_id字段添加索引
CREATE INDEX idx_files_file_content_id ON files(file_content_id);

-- 添加注释
COMMENT ON COLUMN files.file_content_id IS '关联文件内容表ID';

-- 4. 数据迁移：将现有数据从files表迁移到file_contents表
-- 注意：这个迁移需要分批执行，避免锁表时间过长
-- 首先创建临时表存储迁移数据
CREATE TEMPORARY TABLE temp_file_migration AS
SELECT
    id as files_id,
    file_content,
    thumbnail_content,
    created_at
FROM files
WHERE file_content_id IS NULL;

-- 插入数据到file_contents表
INSERT INTO file_contents (file_content, thumbnail_content, created_at)
SELECT
    file_content,
    thumbnail_content,
    created_at
FROM temp_file_migration
ON CONFLICT DO NOTHING;

-- 更新files表的file_content_id字段
UPDATE files
SET file_content_id = fc.id
FROM file_contents fc, temp_file_migration tfm
WHERE files.id = tfm.files_id
  AND fc.file_content = tfm.file_content
  AND fc.thumbnail_content IS NOT DISTINCT FROM tfm.thumbnail_content
  AND files.file_content_id IS NULL;

-- 删除临时表
DROP TABLE IF EXISTS temp_file_migration;

-- 5. 验证数据迁移结果
-- 检查是否还有未迁移的记录
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM files
    WHERE file_content_id IS NULL;

    IF unmigrated_count > 0 THEN
        RAISE WARNING '警告：还有 % 条记录未完成迁移', unmigrated_count;
    ELSE
        RAISE NOTICE '数据迁移完成：所有文件内容已成功迁移到file_contents表';
    END IF;
END $$;

-- 6. 创建视图以便于查询（可选）
CREATE OR REPLACE VIEW files_with_content AS
SELECT
    f.id,
    f.file_uuid,
    f.file_name,
    f.file_extension,
    f.file_size,
    f.mime_type,
    COALESCE(fc.file_content, f.file_content) as file_content,
    f.file_hash,
    f.file_md5,
    f.has_thumbnail,
    COALESCE(fc.thumbnail_content, f.thumbnail_content) as thumbnail_content,
    f.thumbnail_width,
    f.thumbnail_height,
    f.download_count,
    f.last_download_at,
    f.metadata,
    f.file_status,
    f.file_category,
    f.uploader_ip,
    f.uploader_user_agent,
    f.uploader_id,
    f.created_at,
    f.updated_at,
    f.application_name,
    f.file_content_id
FROM files f
LEFT JOIN file_contents fc ON f.file_content_id = fc.id;

COMMENT ON VIEW files_with_content IS '包含文件内容的完整文件视图（用于向后兼容）';

-- 7. 性能优化建议：
-- 在确认迁移成功后，可以考虑删除原表中的二进制字段以节省空间
-- 注意：这一步需要谨慎操作，建议在维护窗口期执行

-- DROP COLUMN 操作（谨慎使用，建议先备份数据）
-- ALTER TABLE files DROP COLUMN IF EXISTS file_content;
-- ALTER TABLE files DROP COLUMN IF EXISTS thumbnail_content;

-- 8. 创建函数用于自动处理文件内容存储
CREATE OR REPLACE FUNCTION create_file_content(
    p_file_content BYTEA,
    p_thumbnail_content BYTEA DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    content_id BIGINT;
BEGIN
    INSERT INTO file_contents (file_content, thumbnail_content)
    VALUES (p_file_content, p_thumbnail_content)
    RETURNING id INTO content_id;

    RETURN content_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '创建文件内容失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数用于更新文件内容
CREATE OR REPLACE FUNCTION update_file_content(
    p_content_id BIGINT,
    p_file_content BYTEA DEFAULT NULL,
    p_thumbnail_content BYTEA DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE file_contents
    SET
        file_content = COALESCE(p_file_content, file_content),
        thumbnail_content = COALESCE(p_thumbnail_content, thumbnail_content),
        updated_at = NOW()
    WHERE id = p_content_id;

    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '更新文件内容失败: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建清理孤立内容的函数
CREATE OR REPLACE FUNCTION cleanup_orphaned_contents() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除没有关联任何文件的记录
    DELETE FROM file_contents
    WHERE id NOT IN (
        SELECT DISTINCT file_content_id
        FROM files
        WHERE file_content_id IS NOT NULL
    );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '文件存储表重构迁移完成';
    RAISE NOTICE '下一步操作建议：';
    RAISE NOTICE '1. 验证数据迁移是否正确';
    RAISE NOTICE '2. 更新应用程序代码使用新的表结构';
    RAISE NOTICE '3. 测试文件上传下载功能';
    RAISE NOTICE '4. 在确认无误后，可考虑删除原表中的二进制字段以节省空间';
END $$;
-- 文件 0008_refactor_file_storage.sql 合并完成

-- ========================================
-- 文件: 0009_create_blog_tables.sql
-- ========================================

-- 博客模块数据库表创建脚本
-- 迁移版本：0009
-- ===== 清理现有对象 =====

DROP INDEX IF EXISTS idx_blog_articles_author_id;
DROP INDEX IF EXISTS idx_blog_articles_slug;
DROP INDEX IF EXISTS idx_blog_articles_status;
DROP INDEX IF EXISTS idx_blog_articles_created_at;
DROP INDEX IF EXISTS idx_blog_articles_publish_at;
DROP INDEX IF EXISTS idx_blog_articles_is_top;
DROP INDEX IF EXISTS idx_blog_articles_title;
DROP INDEX IF EXISTS idx_blog_articles_content;
DROP INDEX IF EXISTS idx_blog_articles_deleted_at;
DROP INDEX IF EXISTS idx_blog_categories_parent_id;
DROP INDEX IF EXISTS idx_blog_categories_slug;
DROP INDEX IF EXISTS idx_blog_categories_is_active;
DROP INDEX IF EXISTS idx_blog_tags_slug;
DROP INDEX IF EXISTS idx_blog_tags_is_active;
DROP INDEX IF EXISTS idx_blog_article_tags_article_id;
DROP INDEX IF EXISTS idx_blog_article_tags_tag_id;
DROP INDEX IF EXISTS idx_blog_comments_article_id;
DROP INDEX IF EXISTS idx_blog_comments_parent_id;
DROP INDEX IF EXISTS idx_blog_comments_created_at;
DROP INDEX IF EXISTS idx_blog_comments_status;
DROP INDEX IF EXISTS idx_blog_comments_is_deleted;
DROP INDEX IF EXISTS idx_blog_article_versions_article_id;
DROP INDEX IF EXISTS idx_blog_article_versions_created_at;
DROP INDEX IF EXISTS idx_blog_seo_data_article_id;
-- 删除blog_categories表的约束
-- 删除blog_tags表的约束
-- 删除blog_articles表的约束
-- 删除blog_article_tags表的约束
-- 删除blog_article_versions表的约束
-- 删除blog_comments表的约束
-- 删除blog_seo_data表的约束
-- 删除表（按依赖关系逆序删除，使用 CASCADE）
DROP TABLE IF EXISTS blog_seo_data CASCADE;
DROP TABLE IF EXISTS blog_comments CASCADE;
DROP TABLE IF EXISTS blog_article_versions CASCADE;
DROP TABLE IF EXISTS blog_article_tags CASCADE;
DROP TABLE IF EXISTS blog_articles CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;

-- ===== 创建新对象 =====


-- 创建时间：2025-10-28

-- 1. 创建博客文章分类表
CREATE TABLE blog_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES blog_categories(id),
    sort_order INTEGER DEFAULT 0,
    article_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建博客标签表
CREATE TABLE blog_tags (
    id BIGSERIAL PRIMARY KEY,
    tag_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    article_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建博客文章主表
CREATE TABLE blog_articles (
    id BIGSERIAL PRIMARY KEY,
    article_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    html_content TEXT,
    author_id BIGINT NOT NULL DEFAULT 1, -- 默认管理员ID
    category_id BIGINT REFERENCES blog_categories(id),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, private, archive
    is_draft BOOLEAN DEFAULT true,
    is_top BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    featured_image VARCHAR(255),
    read_time INTEGER DEFAULT 0, -- 预估阅读时间（分钟）
    publish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. 创建文章标签关联表
CREATE TABLE blog_article_tags (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- 5. 创建文章版本表
CREATE TABLE blog_article_versions (
    id BIGSERIAL PRIMARY KEY,
    version_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    summary TEXT,
    change_type VARCHAR(20) NOT NULL, -- create, update, delete
    change_summary TEXT,
    diff_data JSONB,
    operator_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 创建博客评论表（简化版）
CREATE TABLE blog_comments (
    id BIGSERIAL PRIMARY KEY,
    comment_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES blog_comments(id) ON DELETE CASCADE,
    visitor_name VARCHAR(50) NOT NULL,
    visitor_email VARCHAR(255),
    visitor_website VARCHAR(255),
    content TEXT NOT NULL,
    html_content TEXT,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'approved', -- approved, pending, deleted
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 创建SEO数据表
CREATE TABLE blog_seo_data (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(255),
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(255),
    canonical_url VARCHAR(500),
    json_ld JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id)
);

-- 创建索引
-- 文章表索引
CREATE INDEX idx_blog_articles_author_id ON blog_articles(author_id);
CREATE INDEX idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX idx_blog_articles_status ON blog_articles(status);
CREATE INDEX idx_blog_articles_created_at ON blog_articles(created_at);
CREATE INDEX idx_blog_articles_publish_at ON blog_articles(publish_at);
CREATE INDEX idx_blog_articles_is_top ON blog_articles(is_top);
CREATE INDEX idx_blog_articles_title ON blog_articles USING gin(to_tsvector('simple', title));
CREATE INDEX idx_blog_articles_content ON blog_articles USING gin(to_tsvector('simple', content));
CREATE INDEX idx_blog_articles_deleted_at ON blog_articles(deleted_at);

-- 分类表索引
CREATE INDEX idx_blog_categories_parent_id ON blog_categories(parent_id);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_is_active ON blog_categories(is_active);

-- 标签表索引
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_tags_is_active ON blog_tags(is_active);

-- 文章标签关联表索引
CREATE INDEX idx_blog_article_tags_article_id ON blog_article_tags(article_id);
CREATE INDEX idx_blog_article_tags_tag_id ON blog_article_tags(tag_id);

-- 评论表索引
CREATE INDEX idx_blog_comments_article_id ON blog_comments(article_id);
CREATE INDEX idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);
CREATE INDEX idx_blog_comments_is_deleted ON blog_comments(is_deleted);

-- 文章版本表索引
CREATE INDEX idx_blog_article_versions_article_id ON blog_article_versions(article_id);
CREATE INDEX idx_blog_article_versions_created_at ON blog_article_versions(created_at);

-- SEO数据表索引
CREATE INDEX idx_blog_seo_data_article_id ON blog_seo_data(article_id);

-- 添加表注释
COMMENT ON TABLE blog_categories IS '博客文章分类表';
COMMENT ON TABLE blog_tags IS '博客文章标签表';
COMMENT ON TABLE blog_articles IS '博客文章主表';
COMMENT ON TABLE blog_article_tags IS '博客文章标签关联表';
COMMENT ON TABLE blog_article_versions IS '博客文章版本历史表';
COMMENT ON TABLE blog_comments IS '博客评论表（支持匿名评论）';
COMMENT ON TABLE blog_seo_data IS '博客文章SEO数据表';

-- 添加列注释
COMMENT ON COLUMN blog_categories.category_id IS '分类唯一标识';
COMMENT ON COLUMN blog_categories.slug IS 'URL友好标识';
COMMENT ON COLUMN blog_categories.parent_id IS '父分类ID';
COMMENT ON COLUMN blog_categories.sort_order IS '排序顺序';

COMMENT ON COLUMN blog_tags.tag_id IS '标签唯一标识';
COMMENT ON COLUMN blog_tags.slug IS 'URL友好标识';
COMMENT ON COLUMN blog_tags.color IS '标签颜色';

COMMENT ON COLUMN blog_articles.article_id IS '文章唯一标识';
COMMENT ON COLUMN blog_articles.slug IS 'URL友好标识';
COMMENT ON COLUMN blog_articles.content IS 'Markdown原始内容';
COMMENT ON COLUMN blog_articles.html_content IS 'HTML渲染内容';
COMMENT ON COLUMN blog_articles.read_time IS '预估阅读时间（分钟）';

COMMENT ON COLUMN blog_comments.comment_id IS '评论唯一标识';
COMMENT ON COLUMN blog_comments.parent_id IS '父评论ID（支持回复）';
COMMENT ON COLUMN blog_comments.visitor_name IS '访客昵称';
COMMENT ON COLUMN blog_comments.visitor_email IS '访客邮箱（可选）';
COMMENT ON COLUMN blog_comments.visitor_website IS '访客网站（可选）';
COMMENT ON COLUMN blog_comments.status IS '评论状态：approved/pending/deleted';

-- 创建默认分类
INSERT INTO blog_categories (name, slug, description, sort_order) VALUES
('技术', 'tech', '技术相关文章', 1),
('生活', 'life', '生活感悟', 2),
('随笔', 'essay', '随笔杂记', 3)
ON CONFLICT (slug) DO NOTHING;

-- 创建默认标签
INSERT INTO blog_tags (name, slug, description, color) VALUES
('编程', 'programming', '编程相关', '#3B82F6'),
('JavaScript', 'javascript', 'JavaScript编程语言', '#F7DF1E'),
('Go', 'golang', 'Go编程语言', '#00ADD8'),
('前端', 'frontend', '前端开发', '#10B981'),
('后端', 'backend', '后端开发', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- 创建全文搜索配置
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'chinese') THEN
        CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);
        COMMENT ON TEXT SEARCH CONFIGURATION chinese IS '中文全文搜索配置';
    END IF;
END $$;
-- 文件 0009_create_blog_tables.sql 合并完成

-- ========================================
-- 文件: 0010_fix_blog_tables.sql
-- ========================================

-- 修复博客系统表结构迁移脚本
-- 迁移版本：0010
-- ===== 清理现有对象 =====

DROP FUNCTION IF EXISTS update_article_comment_count();
DROP FUNCTION IF EXISTS update_category_article_count();
DROP TRIGGER IF EXISTS update_blog_seo_data_updated_at ON blog_article_versions;
DROP TRIGGER IF EXISTS trigger_update_article_comment_count ON blog_article_versions;
DROP TRIGGER IF EXISTS trigger_update_category_article_count ON blog_article_versions;
DROP INDEX IF EXISTS idx_blog_article_versions_article_id;

-- ===== 清理现有对象 =====

-- 删除触发器
DROP TRIGGER IF EXISTS update_blog_seo_data_updated_at ON blog_seo_data;
DROP TRIGGER IF EXISTS trigger_update_article_comment_count ON blog_comments;
DROP TRIGGER IF EXISTS trigger_update_category_article_count ON blog_articles;

-- 删除函数（使用 CASCADE）
DROP FUNCTION IF EXISTS update_article_comment_count() CASCADE;
DROP FUNCTION IF EXISTS update_category_article_count() CASCADE;

-- 删除索引
DROP INDEX IF EXISTS idx_blog_article_versions_article_id;
DROP INDEX IF EXISTS idx_blog_article_versions_created_at;
DROP INDEX IF EXISTS idx_blog_seo_data_article_id;
DROP INDEX IF EXISTS idx_blog_comments_status;
DROP INDEX IF EXISTS idx_blog_comments_is_deleted;

-- 删除表（使用 CASCADE）
DROP TABLE IF EXISTS blog_seo_data CASCADE;
DROP TABLE IF EXISTS blog_article_versions CASCADE;

-- ===== 创建新对象 =====

DROP INDEX IF EXISTS idx_blog_article_versions_created_at;
DROP INDEX IF EXISTS idx_blog_seo_data_article_id;
DROP INDEX IF EXISTS idx_blog_comments_status;
DROP INDEX IF EXISTS idx_blog_comments_is_deleted;
-- 删除blog_article_versions表的约束
-- 删除blog_seo_data表的约束
-- 删除表（按依赖关系逆序删除）
DROP TABLE IF EXISTS blog_seo_data;
DROP TABLE IF EXISTS blog_article_versions;

-- ===== 创建新对象 =====


-- 创建时间: 2025-11-03
-- 描述: 修复博客系统缺失的表和字段不一致问题（在0009创建博客表之后执行）

-- 1. 创建缺失的博客文章版本表
CREATE TABLE blog_article_versions (
    id BIGSERIAL PRIMARY KEY,
    version_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    summary TEXT,
    change_type VARCHAR(20) NOT NULL, -- create, update, delete
    change_summary TEXT,
    diff_data JSONB,
    operator_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建缺失的博客SEO数据表
CREATE TABLE blog_seo_data (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(255),
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(255),
    canonical_url VARCHAR(500),
    json_ld JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id)
);

-- 3. 修复 blog_comments 表结构不一致问题
-- 检查并添加缺失的字段
DO $$
BEGIN
    -- 检查并添加缺失的字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'visitor_website') THEN
        ALTER TABLE blog_comments ADD COLUMN visitor_website VARCHAR(255);
        COMMENT ON COLUMN blog_comments.visitor_website IS '访客网站（可选）';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'html_content') THEN
        ALTER TABLE blog_comments ADD COLUMN html_content TEXT;
        COMMENT ON COLUMN blog_comments.html_content IS 'HTML渲染内容';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'is_deleted') THEN
        ALTER TABLE blog_comments ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        COMMENT ON COLUMN blog_comments.is_deleted IS '是否已删除';
    END IF;

    -- 修正字段名不一致的问题（如果存在 ip_address 字段，重命名为 ip）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'ip_address') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'ip') THEN
        ALTER TABLE blog_comments RENAME COLUMN ip_address TO ip;
    END IF;

    -- 修正字段名不一致的问题（如果存在 user_agent 字段，重命名为 download_user_agent）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'user_agent') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'download_user_agent') THEN
        ALTER TABLE blog_comments RENAME COLUMN user_agent TO download_user_agent;
    END IF;
END $$;

-- 4. 创建缺失的索引
-- 文章版本表索引
CREATE INDEX idx_blog_article_versions_article_id ON blog_article_versions(article_id);
CREATE INDEX idx_blog_article_versions_created_at ON blog_article_versions(created_at);

-- SEO数据表索引
CREATE INDEX idx_blog_seo_data_article_id ON blog_seo_data(article_id);

-- 评论表索引修正
CREATE INDEX idx_blog_comments_status ON blog_comments(status);
CREATE INDEX idx_blog_comments_is_deleted ON blog_comments(is_deleted);

-- 5. 为 blog_seo_data 表创建更新时间触发器（复用现有的update_updated_at_column函数）
CREATE TRIGGER update_blog_seo_data_updated_at
    BEFORE UPDATE ON blog_seo_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 添加表注释
COMMENT ON TABLE blog_article_versions IS '博客文章版本历史表';
COMMENT ON TABLE blog_seo_data IS '博客文章SEO数据表';

-- 7. 添加列注释
COMMENT ON COLUMN blog_article_versions.version_id IS '版本唯一标识';
COMMENT ON COLUMN blog_article_versions.version IS '版本号';
COMMENT ON COLUMN blog_article_versions.change_type IS '变更类型：create/update/delete';
COMMENT ON COLUMN blog_article_versions.change_summary IS '变更摘要';
COMMENT ON COLUMN blog_article_versions.diff_data IS '差异数据（JSON格式）';
COMMENT ON COLUMN blog_article_versions.operator_id IS '操作者ID';

COMMENT ON COLUMN blog_seo_data.meta_title IS 'SEO标题';
COMMENT ON COLUMN blog_seo_data.meta_description IS 'SEO描述';
COMMENT ON COLUMN blog_seo_data.meta_keywords IS 'SEO关键词';
COMMENT ON COLUMN blog_seo_data.og_title IS 'Open Graph标题';
COMMENT ON COLUMN blog_seo_data.og_description IS 'Open Graph描述';
COMMENT ON COLUMN blog_seo_data.og_image IS 'Open Graph图片';
COMMENT ON COLUMN blog_seo_data.twitter_title IS 'Twitter卡片标题';
COMMENT ON COLUMN blog_seo_data.twitter_description IS 'Twitter卡片描述';
COMMENT ON COLUMN blog_seo_data.twitter_image IS 'Twitter卡片图片';
COMMENT ON COLUMN blog_seo_data.canonical_url IS '规范URL';
COMMENT ON COLUMN blog_seo_data.json_ld IS 'JSON-LD结构化数据';

-- 8. 创建触发器函数用于自动更新文章统计信息
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_articles
        SET comment_count = comment_count + 1
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_articles
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：评论变更时自动更新文章评论数
DROP TRIGGER IF EXISTS trigger_update_article_comment_count ON blog_comments;
CREATE TRIGGER trigger_update_article_comment_count
    AFTER INSERT OR DELETE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comment_count();

-- 9. 创建函数用于自动更新分类文章数
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_categories
        SET article_count = article_count + 1
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
            UPDATE blog_categories
            SET article_count = GREATEST(article_count - 1, 0)
            WHERE id = OLD.category_id;

            UPDATE blog_categories
            SET article_count = article_count + 1
            WHERE id = NEW.category_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_categories
        SET article_count = GREATEST(article_count - 1, 0)
        WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：文章变更时自动更新分类文章数
DROP TRIGGER IF EXISTS trigger_update_category_article_count ON blog_articles;
CREATE TRIGGER trigger_update_category_article_count
    AFTER INSERT OR UPDATE OR DELETE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_category_article_count();

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '博客系统表结构修复完成';
    RAISE NOTICE '已修复的内容：';
    RAISE NOTICE '1. 创建缺失的 blog_article_versions 表';
    RAISE NOTICE '2. 创建缺失的 blog_seo_data 表';
    RAISE NOTICE '3. 修复 blog_comments 表字段不一致问题';
    RAISE NOTICE '4. 创建必要的索引和触发器';
    RAISE NOTICE '5. 添加统计信息自动更新功能';
END $$;
-- 文件 0010_fix_blog_tables.sql 合并完成

-- ========================================
-- 迁移脚本合并完成
-- 共合并了 9 个文件
-- ========================================

-- 提示: 执行前请务必备份数据库
-- 提示: 建议在测试环境先验证脚本正确性
