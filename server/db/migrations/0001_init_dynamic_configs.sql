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