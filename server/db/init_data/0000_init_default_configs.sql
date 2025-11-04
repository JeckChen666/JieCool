-- 动态配置初始化脚本
-- 创建时间: 2025-11-03
-- 描述: 初始化系统运行所需的默认配置项

-- ⚠️ 重要：这个脚本必须在所有迁移脚本执行完成后运行！
-- 执行顺序：先执行所有 migrations 文件夹中的迁移脚本（0001-0010），再执行此脚本
-- 依赖：dynamic_configs 表必须在 0001_init_dynamic_configs.sql 中已创建

-- 1. 系统配置 (system namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 文件清理配置
('system', 'default', 'file_cleanup_enabled', 'boolean', 'true', true, '是否启用文件自动清理功能', 'system'),
('system', 'default', 'file_cleanup_interval_hours', 'number', '24', true, '清理任务执行间隔（小时）', 'system'),
('system', 'default', 'file_cleanup_retention_days', 'number', '10', true, '文件删除后保留天数（软删除超过此天数将被物理删除）', 'system'),
('system', 'default', 'file_cleanup_batch_size', 'number', '100', true, '每次清理处理的文件数量（分批处理）', 'system'),
('system', 'default', 'file_cleanup_log_enabled', 'boolean', 'true', true, '是否记录清理日志', 'system'),

-- 系统运行配置
('system', 'default', 'max_file_upload_size_mb', 'number', '100', true, '最大文件上传大小（MB）', 'system'),
('system', 'default', 'allowed_file_types', 'json', '{"images": ["jpg","jpeg","png","gif","webp"], "documents": ["pdf","doc","docx","txt","md"], "archives": ["zip","rar","7z"], "media": ["mp4","mp3","avi"]}', true, '允许上传的文件类型', 'system'),
('system', 'default', 'thumbnail_enabled', 'boolean', 'true', true, '是否启用缩略图生成', 'system'),
('system', 'default', 'thumbnail_max_width', 'number', '300', true, '缩略图最大宽度', 'system'),
('system', 'default', 'thumbnail_max_height', 'number', '300', true, '缩略图最大高度', 'system'),

-- 日志配置
('system', 'default', 'access_log_enabled', 'boolean', 'true', true, '是否启用访问日志记录', 'system'),
('system', 'default', 'access_log_retention_days', 'number', '90', true, '访问日志保留天数', 'system'),
('system', 'default', 'access_log_anonymous_enabled', 'boolean', 'true', true, '是否记录匿名用户访问', 'system'),

-- 性能配置
('system', 'default', 'cache_enabled', 'boolean', 'true', true, '是否启用缓存', 'system'),
('system', 'default', 'cache_ttl_seconds', 'number', '3600', true, '缓存过期时间（秒）', 'system'),
('system', 'default', 'concurrent_upload_limit', 'number', '5', true, '并发上传限制', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 2. 认证配置 (auth namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- JWT配置
('auth', 'default', 'jwt_secret', 'string', 'change-me-in-production-jwt-secret-key', true, 'JWT签名密钥（生产环境必须修改）', 'system'),
('auth', 'default', 'jwt_expire_hours', 'number', '24', true, 'JWT过期时间（小时）', 'system'),
('auth', 'default', 'jwt_refresh_days', 'number', '7', true, 'JWT刷新令牌有效期（天）', 'system'),

-- URL Token配置
('auth', 'default', 'url_token_enabled', 'boolean', 'true', true, '是否启用URL Token功能', 'system'),
('auth', 'default', 'url_token_ttl', 'number', '3600', true, 'URL token默认有效期（秒）', 'system'),
('auth', 'default', 'url_token_max_uses', 'number', '1', true, 'URL token最大使用次数', 'system'),

-- 前端域名配置
('auth', 'default', 'frontend_domain', 'string', 'http://localhost:3000', true, '前端域名，用于生成登录URL', 'system'),
('auth', 'default', 'backend_domain', 'string', 'http://localhost:8080', true, '后端域名，用于生成回调URL', 'system'),

-- 登录配置
('auth', 'default', 'login_enabled', 'boolean', 'true', true, '是否启用登录功能', 'system'),
('auth', 'default', 'max_login_attempts', 'number', '5', true, '最大登录尝试次数', 'system'),
('auth', 'default', 'login_lockout_minutes', 'number', '15', true, '登录锁定时间（分钟）', 'system'),

-- OAuth配置（预留）
('auth', 'default', 'oauth_enabled', 'boolean', 'false', false, '是否启用OAuth登录', 'system'),
('auth', 'default', 'oauth_providers', 'json', '{"github": {"enabled": false}, "google": {"enabled": false}}', true, 'OAuth提供商配置', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 3. 开发环境配置 (dev env specific overrides)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 开发环境认证配置
('auth', 'dev', 'jwt_secret', 'string', 'dev-jwt-secret-do-not-use-in-production', true, '开发环境JWT密钥', 'system'),
('auth', 'dev', 'frontend_domain', 'string', 'http://localhost:3000', true, '开发环境前端域名', 'system'),
('auth', 'dev', 'backend_domain', 'string', 'http://localhost:8080', true, '开发环境后端域名', 'system'),
('auth', 'dev', 'url_token_ttl', 'number', '7200', true, '开发环境URL token有效期（2小时）', 'system'),

-- 开发环境系统配置
('system', 'dev', 'file_cleanup_enabled', 'boolean', 'false', true, '开发环境禁用文件自动清理', 'system'),
('system', 'dev', 'access_log_enabled', 'boolean', 'true', true, '开发环境启用访问日志', 'system'),
('system', 'dev', 'cache_enabled', 'boolean', 'false', true, '开发环境禁用缓存', 'system'),
('system', 'dev', 'max_file_upload_size_mb', 'number', '50', true, '开发环境文件上传限制（MB）', 'system'),

-- 开发环境调试配置
('core', 'dev', 'debug_enabled', 'boolean', 'true', true, '是否启用调试模式', 'system'),
('core', 'dev', 'log_level', 'string', 'debug', true, '日志级别：debug/info/warn/error', 'system'),
('core', 'dev', 'sql_debug', 'boolean', 'true', true, '是否启用SQL调试日志', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 4. 生产环境配置 (prod env specific)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 生产环境认证配置
('auth', 'prod', 'frontend_domain', 'string', 'https://your-domain.com', true, '生产环境前端域名（需要修改）', 'system'),
('auth', 'prod', 'backend_domain', 'string', 'https://api.your-domain.com', true, '生产环境后端域名（需要修改）', 'system'),

-- 生产环境安全配置
('auth', 'prod', 'login_enabled', 'boolean', 'true', true, '生产环境启用登录', 'system'),
('auth', 'prod', 'max_login_attempts', 'number', '3', true, '生产环境最大登录尝试次数', 'system'),
('auth', 'prod', 'login_lockout_minutes', 'number', '30', true, '生产环境登录锁定时间', 'system'),

-- 生产环境系统配置
('system', 'prod', 'file_cleanup_enabled', 'boolean', 'true', true, '生产环境启用文件自动清理', 'system'),
('system', 'prod', 'access_log_enabled', 'boolean', 'true', true, '生产环境启用访问日志', 'system'),
('system', 'prod', 'cache_enabled', 'boolean', 'true', true, '生产环境启用缓存', 'system'),
('system', 'prod', 'max_file_upload_size_mb', 'number', '200', true, '生产环境文件上传限制（MB）', 'system'),

-- 生产环境性能配置
('system', 'prod', 'concurrent_upload_limit', 'number', '10', true, '生产环境并发上传限制', 'system'),
('system', 'prod', 'cache_ttl_seconds', 'number', '7200', true, '生产环境缓存过期时间', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 5. 核心功能配置 (core namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 功能开关
('core', 'default', 'file_management_enabled', 'boolean', 'true', true, '是否启用文件管理功能', 'system'),
('core', 'default', 'weibo_enabled', 'boolean', 'true', true, '是否启用微博功能', 'system'),
('core', 'default', 'blog_enabled', 'boolean', 'true', true, '是否启用博客功能', 'system'),
('core', 'default', 'daily_sentence_enabled', 'boolean', 'true', true, '是否启用每日一句功能', 'system'),

-- 站点信息
('core', 'default', 'site_name', 'string', 'JieCool', true, '站点名称', 'system'),
('core', 'default', 'site_description', 'string', '个人网站，分享技术见解，记录学习历程', true, '站点描述', 'system'),
('core', 'default', 'site_keywords', 'json', '["技术", "博客", "分享", "编程", "生活"]', true, '站点关键词', 'system'),
('core', 'default', 'site_author', 'string', 'JieCool', true, '站点作者', 'system'),

-- 联系信息
('core', 'default', 'contact_email', 'string', 'contact@jiecool.com', true, '联系邮箱', 'system'),
('core', 'default', 'social_links', 'json', '{"github": "https://github.com/yourname", "twitter": "https://twitter.com/yourname", "weibo": "https://weibo.com/yourname"}', true, '社交媒体链接', 'system'),

-- SEO配置
('core', 'default', 'seo_enabled', 'boolean', 'true', true, '是否启用SEO优化', 'system'),
('core', 'default', 'sitemap_enabled', 'boolean', 'true', true, '是否启用站点地图', 'system'),
('core', 'default', 'robots_enabled', 'boolean', 'true', true, '是否启用robots.txt', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 6. 博客配置 (blog namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 博客功能配置
('blog', 'default', 'comments_enabled', 'boolean', 'true', true, '是否启用博客评论功能', 'system'),
('blog', 'default', 'anonymous_comments', 'boolean', 'true', true, '是否允许匿名评论', 'system'),
('blog', 'default', 'comment_moderation', 'boolean', 'false', true, '是否启用评论审核', 'system'),
('blog', 'default', 'markdown_enabled', 'boolean', 'true', true, '是否启用Markdown编辑器', 'system'),

-- 博客显示配置
('blog', 'default', 'posts_per_page', 'number', '10', true, '每页显示文章数量', 'system'),
('blog', 'default', 'recent_posts_count', 'number', '5', true, '侧边栏最新文章数量', 'system'),
('blog', 'default', 'related_posts_count', 'number', '3', true, '相关文章显示数量', 'system'),
('blog', 'default', 'excerpt_length', 'number', '200', true, '文章摘要长度', 'system'),

-- 博客时间配置
('blog', 'default', 'read_time_enabled', 'boolean', 'true', true, '是否计算阅读时间', 'system'),
('blog', 'default', 'words_per_minute', 'number', '200', true, '每分钟阅读字数（用于计算阅读时间）', 'system'),
('blog', 'default', 'published_date_format', 'string', '2006-01-02', true, '发布日期显示格式', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 7. 文件上传配置 (upload namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 文件类型限制
('upload', 'default', 'image_types', 'json', '["jpg","jpeg","png","gif","webp","bmp","svg"]', true, '允许上传的图片类型', 'system'),
('upload', 'default', 'document_types', 'json', '["pdf","doc","docx","txt","md","rtf","odt"]', true, '允许上传的文档类型', 'system'),
('upload', 'default', 'video_types', 'json', '["mp4","avi","mov","wmv","flv","webm"]', true, '允许上传的视频类型', 'system'),
('upload', 'default', 'audio_types', 'json', '["mp3","wav","flac","aac","ogg"]', true, '允许上传的音频类型', 'system'),

-- 文件大小限制（按类型）
('upload', 'default', 'max_image_size_mb', 'number', '10', true, '图片最大文件大小（MB）', 'system'),
('upload', 'default', 'max_document_size_mb', 'number', '50', true, '文档最大文件大小（MB）', 'system'),
('upload', 'default', 'max_video_size_mb', 'number', '500', true, '视频最大文件大小（MB）', 'system'),
('upload', 'default', 'max_audio_size_mb', 'number', '50', true, '音频最大文件大小（MB）', 'system'),

-- 图片处理配置
('upload', 'default', 'auto_orient', 'boolean', 'true', true, '是否自动修正图片方向', 'system'),
('upload', 'default', 'compress_images', 'boolean', 'true', true, '是否压缩上传的图片', 'system'),
('upload', 'default', 'image_quality', 'number', '85', true, '图片压缩质量（0-100）', 'system'),
('upload', 'default', 'create_thumbnails', 'boolean', 'true', true, '是否为图片创建缩略图', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 8. 微博配置 (weibo namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 微博功能配置
('weibo', 'default', 'max_length', 'number', '500', true, '微博最大字符数', 'system'),
('weibo', 'default', 'allow_images', 'boolean', 'true', true, '是否允许发布图片', 'system'),
('weibo', 'default', 'max_images', 'number', '9', true, '每条微博最大图片数量', 'system'),
('weibo', 'default', 'allow_location', 'boolean', 'true', true, '是否允许添加位置信息', 'system'),

-- 微博显示配置
('weibo', 'default', 'posts_per_page', 'number', '20', true, '每页显示微博数量', 'system'),
('weibo', 'default', 'show_timestamp', 'boolean', 'true', true, '是否显示时间戳', 'system'),
('weibo', 'default', 'show_device', 'boolean', 'false', true, '是否显示发布设备', 'system'),
('weibo', 'default', 'auto_refresh_interval', 'number', '30', true, '自动刷新间隔（秒，0表示禁用）', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 9. 每日一句配置 (daily namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 每日一句功能配置
('daily', 'default', 'enabled', 'boolean', 'true', true, '是否启用每日一句功能', 'system'),
('daily', 'default', 'api_provider', 'string', 'jinshan', true, 'API提供商：jinshan', 'system'),
('daily', 'default', 'cache_hours', 'number', '1', true, '内容缓存时间（小时）', 'system'),
('daily', 'default', 'show_audio', 'boolean', 'true', true, '是否显示音频播放', 'system'),
('daily', 'default', 'auto_extract_color', 'boolean', 'true', true, '是否自动提取图片主色调', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 10. 通知配置 (notification namespace)
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
-- 通知功能配置
('notification', 'default', 'email_enabled', 'boolean', 'false', false, '是否启用邮件通知（需要配置SMTP）', 'system'),
('notification', 'default', 'comment_notification', 'boolean', 'true', true, '是否启用评论通知', 'system'),
('notification', 'default', 'system_notification', 'boolean', 'true', true, '是否启用系统通知', 'system'),
('notification', 'default', 'notification_retention_days', 'number', '30', true, '通知保留天数', 'system')

ON CONFLICT (namespace, env, key) DO NOTHING;

-- 创建配置初始化完成的标记
INSERT INTO dynamic_configs (namespace, env, key, type, value, enabled, description, updated_by) VALUES
('system', 'default', 'config_initialized', 'boolean', 'true', true, '配置初始化完成标记', 'system')
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
    RAISE NOTICE '重要提醒：';
    RAISE NOTICE '1. 生产环境请修改 JWT_SECRET 和域名配置';
    RAISE NOTICE '2. 检查并根据需要调整文件上传限制';
    RAISE NOTICE '3. 配置邮件通知功能（如需要）';
    RAISE NOTICE '4. 根据实际需求调整缓存和日志设置';
    RAISE NOTICE '==========================================';
END $$;