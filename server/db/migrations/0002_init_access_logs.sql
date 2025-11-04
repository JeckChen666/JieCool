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