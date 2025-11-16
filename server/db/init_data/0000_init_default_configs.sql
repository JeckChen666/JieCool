-- 动态配置初始化脚本
-- 基于实际数据库结构和使用情况编写
-- 创建时间: 2025-11-09
-- 描述: 初始化系统运行所需的核心配置项

-- ⚠️ 重要：这个脚本必须在所有迁移脚本执行完成后运行！

-- 1. 系统配置 (system namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 文件清理配置（基于现有表结构）
('system', 'default', 'file_cleanup_enabled', 'boolean', 'true', true, '是否启用文件自动清理功能', 'system'),
('system', 'default', 'file_cleanup_interval_hours', 'number', '24', true, '清理任务执行间隔（小时）', 'system'),
('system', 'default', 'file_cleanup_retention_days', 'number', '10', true, '文件删除后保留天数（软删除超过此天数将被物理删除）', 'system'),
('system', 'default', 'file_cleanup_batch_size', 'number', '100', true, '每次清理处理的文件数量（分批处理）', 'system'),
('system', 'default', 'file_cleanup_log_enabled', 'boolean', 'true', true, '是否记录清理日志', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 2. 认证配置 (auth namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- JWT配置
('auth', 'default', 'jwt_secret', 'string', '"jiecool-production-secret-36f0b5f6a87f4c30b9d5c5c5e8a9b7c2"', true, 'JWT签名密钥（生产环境必须修改）', 'system'),
('auth', 'default', 'frontend_domain', 'string', '"http://localhost:53000"', true, '前端域名，用于生成登录URL', 'system'),
('auth', 'default', 'url_token_ttl', 'number', '3600', true, 'URL token默认有效期（秒）', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 3. 开发环境认证配置
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
('auth', 'dev', 'jwt_secret', 'string', '"jiecool-dev-jwt-secret-for-local-development"', true, '开发环境JWT密钥', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 4. 核心功能配置 (core namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 登录配置（基于现有 keyPassword）
('core', 'dev', 'keyPassword', 'string', '"admin123"', true, '开发环境登录密码', 'system'),

-- 功能开关
('core', 'prod', 'feature_flag_file_management', 'boolean', 'true', true, '文件管理功能开关', 'system'),
('core', 'prod', 'feature_flag_daily_sentence', 'boolean', 'true', true, '每日一句功能开关', 'system'),
('core', 'prod', 'feature_flag_weibo_module', 'boolean', 'true', true, '微博模块功能开关', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 5. 生产环境域名配置
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
('core', 'prod', 'api_base_url', 'string', '"http://47.96.90.99:58080"', true, '生产环境API基础地址', 'system'),
('core', 'prod', 'frontend_base_url', 'string', '"http://47.96.90.99:53000"', true, '生产环境前端基础地址', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 显示初始化结果
DO $$
DECLARE
    config_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO config_count FROM dynamic_configs WHERE enabled = true;

    RAISE NOTICE '==========================================';
    RAISE NOTICE '动态配置初始化完成';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '已初始化 % 条配置项', config_count;
    RAISE NOTICE '';
    RAISE NOTICE '配置分类：';
    RAISE NOTICE '- system: 系统配置';
    RAISE NOTICE '- auth: 认证配置';
    RAISE NOTICE '- core: 核心功能配置';
    RAISE NOTICE '';
    RAISE NOTICE '重要提醒：';
    RAISE NOTICE '1. 生产环境请修改 JWT_SECRET';
    RAISE NOTICE '2. 根据实际部署调整域名配置';
    RAISE NOTICE '3. 开发环境密码为: admin123';
    RAISE NOTICE '==========================================';
END $$;