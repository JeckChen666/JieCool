# 访问统计模块（Visit Analytics Module）

## 模块预期实现的目标

实现无侵入式的用户访问行为追踪系统，自动收集访问日志、用户行为数据和系统性能指标。通过分析用户访问模式、页面热度、流量来源等数据，为网站运营决策提供数据支持。该模块支持多种存储方式（数据库、文件），具备高并发处理能力，适用于个人网站的用户行为分析和运营数据统计。

## 模块预期的功能点

### 1. 访问日志收集
- **自动采集**：无侵入式自动收集页面访问信息
- **完整记录**：记录IP地址、User-Agent、访问路径、HTTP方法等详细信息
- **请求头解析**：提取Referer、Accept-Language等客户端信息
- **时间戳记录**：精确记录访问时间，支持时区转换

### 2. 用户行为分析
- **页面热度**：统计各页面访问频次和停留时间
- **用户轨迹**：分析用户在网站内的浏览路径
- **访问来源**：分析流量来源（直接访问、搜索引擎、外链等）
- **设备分析**：统计访问设备类型、浏览器、操作系统分布

### 3. 实时统计
- **实时监控**：实时在线用户数、当前访问量统计
- **峰值分析**：记录访问峰值时段和服务器负载
- **异常检测**：识别异常访问模式和潜在安全威胁
- **性能监控**：记录页面加载时间和响应时间

### 4. 数据存储管理
- **多存储支持**：支持数据库存储和文件存储两种模式
- **数据压缩**：对历史数据进行压缩存储，节省存储空间
- **数据清理**：定期清理过期数据，保持系统性能
- **备份恢复**：支持访问数据的备份和恢复功能

## 数据流向与处理逻辑

### 1. 访问数据收集流程
```
用户访问页面 → 前端触发追踪 → 异步发送日志数据
                    ↓
后端接收请求 → 数据验证 → 存储到数据库/文件
                    ↓
更新统计缓存 → 触发实时分析 → 记录处理结果
```

### 2. 数据分析处理流程
```
定时任务触发 → 查询原始日志 → 数据聚合计算
                    ↓
更新统计指标 → 生成分析报告 → 更新缓存数据
                    ↓
发送通知告警 → 清理临时数据 → 完成处理周期
```

### 3. 实时监控流程
```
WebSocket连接 → 实时数据推送 → 前端数据更新
                    ↓
统计指标计算 → 阈值比较 → 异常检测告警
                    ↓
仪表板刷新 → 可视化图表更新 → 用户交互响应
```

## 重点代码设计逻辑

### 1. 访问日志记录逻辑
```pseudocode
PROCEDURE RecordVisitLog(requestData)
    TRY:
        步骤1: 提取基础访问信息（IP、User-Agent、路径等）
        步骤2: 解析请求头获取详细信息
        步骤3: 生成唯一访问标识（UUID）
        步骤4: 验证数据完整性和格式
        步骤5: 选择存储策略（数据库或文件）
        步骤6: 异步存储访问日志
        步骤7: 更新实时统计缓存
        步骤8: 触发数据处理器
        返回记录成功状态
    CATCH 数据验证异常:
        记录验证错误日志
    CATCH 存储异常:
        尝试文件存储兜底
    CATCH 系统资源异常:
        降级处理，不影响用户访问
    END PROCEDURE
```

### 2. 数据聚合分析逻辑
```pseudocode
PROCEDURE AggregateAnalytics(timeRange, metrics)
    TRY:
        步骤1: 查询指定时间范围的原始访问数据
        步骤2: 按时间维度分组（小时/天/周/月）
        步骤3: 计算访问量统计（PV、UV、IP数）
        步骤4: 分析页面热度和用户行为
        步骤5: 统计设备类型和浏览器分布
        步骤6: 计算流量来源和访问路径
        步骤7: 生成趋势分析数据
        步骤8: 更新聚合结果缓存
        返回分析结果数据
    CATCH 查询异常:
        记录查询错误，返回缓存数据
    CATCH 计算异常:
        降级计算，返回部分结果
    END PROCEDURE
```

### 3. 实时监控逻辑
```pseudocode
PROCEDURE RealTimeMonitoring()
    TRY:
        步骤1: 获取当前活跃用户数
        步骤2: 计算最近5分钟访问量
        步骤3: 监控页面响应时间
        步骤4: 检测异常访问模式
        步骤5: 比较当前指标与历史基线
        步骤6: 识别性能异常和流量突增
        步骤7: 生成实时监控报告
        步骤8: 推送监控数据到前端
        返回监控状态
    CATCH 监控异常:
        记录监控错误，保持监控连续性
    END PROCEDURE
```

### 4. 数据清理逻辑
```pseudocode
PROCEDURE DataCleanup(retentionPolicy)
    TRY:
        步骤1: 查询过期数据（根据保留策略）
        步骤2: 分批删除过期原始日志数据
        步骤3: 压缩保留的聚合数据
        步骤4: 清理过期缓存数据
        步骤5: 更新数据存储空间统计
        步骤6: 记录清理操作日志
        步骤7: 生成清理报告
        返回清理统计信息
    CATCH 清理异常:
        回滚清理操作，记录错误日志
    END PROCEDURE
```

### 5. 异常检测逻辑
```pseudocode
PROCEDURE AnomalyDetection(currentMetrics, baselineMetrics)
    步骤1: 计算指标变化率
    步骤2: 比较当前值与基线值
    步骤3: 检测异常模式（流量突增、异常访问路径等）
    步骤4: 评估异常严重程度
    步骤5: 生成异常告警信息
    步骤6: 发送告警通知
    步骤7: 记录异常事件日志
    返回异常检测结果
END PROCEDURE
```

## 数据库设计模式

### 1. 访问日志一体化存储模式

**完整请求信息存储**：
```sql
-- 访问日志主表设计
CREATE TABLE logs_visit_access (
    id BIGSERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL,                    -- 访问时间（精确到毫秒）
    ip TEXT,                                       -- 访问者IP地址
    user_agent TEXT,                               -- 用户代理字符串
    method TEXT,                                   -- HTTP方法
    path TEXT,                                     -- 请求路径
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,    -- 完整请求头（JSONB格式）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**请求头JSONB存储**：
- 所有HTTP请求头以JSONB格式存储，支持灵活查询
- `headers->>'x-forwarded-for'` 获取真实IP
- `headers->>'x-real-ip'` 备用IP获取
- `headers->>'user-agent'` 原始用户代理

### 2. 多维度统计视图模式

**时间维度聚合视图**：
```sql
-- 每日访问统计视图
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
```

**多维度分析视图**：
- `hourly_visit_stats`：小时级别访问统计
- `path_visit_stats`：页面访问热度统计
- `user_agent_stats`：浏览器类型统计
- `geo_location_stats`：地理位置统计

### 3. JSONB索引优化模式

**GIN索引支持高效查询**：
```sql
-- 请求头JSONB字段的GIN索引
CREATE INDEX idx_logs_visit_access_headers_gin
ON logs_visit_access USING GIN(headers);

-- 时间索引（降序）
CREATE INDEX idx_logs_visit_access_time
ON logs_visit_access(time DESC);

-- 基础字段索引
CREATE INDEX idx_logs_visit_access_ip ON logs_visit_access(ip);
CREATE INDEX idx_logs_visit_access_method ON logs_visit_access(method);
CREATE INDEX idx_logs_visit_access_path ON logs_visit_access(path);
```

**JSONB查询优化**：
- 支持请求头的任意字段查询
- 高效的IP地理位置分析
- 浏览器和设备信息解析

### 4. 地理位置识别模式

**多源IP获取机制**：
```sql
-- 地理位置统计视图
CREATE OR REPLACE VIEW geo_location_stats AS
SELECT
    CASE
        WHEN headers->>'x-forwarded-for' IS NOT NULL
        THEN headers->>'x-forwarded-for'
        WHEN headers->>'x-real-ip' IS NOT NULL
        THEN headers->>'x-real-ip'
        ELSE ip
    END as real_ip,
    COUNT(*) as visit_count,
    COUNT(DISTINCT ip) as unique_visitors,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '30 days'
  AND (headers->>'x-forwarded-for' IS NOT NULL
       OR headers->>'x-real-ip' IS NOT NULL)
GROUP BY real_ip
ORDER BY visit_count DESC;
```

**代理头优先级处理**：
- 优先使用 `x-forwarded-for` 头（CDN/代理场景）
- 备用 `x-real-ip` 头（负载均衡场景）
- 最后使用直接连接IP

### 5. 浏览器智能识别模式

**浏览器类型归类**：
```sql
-- 浏览器类型统计视图
CREATE OR REPLACE VIEW user_agent_stats AS
SELECT
    CASE
        WHEN user_agent ~* 'Chrome' THEN 'Chrome'
        WHEN user_agent ~* 'Firefox' THEN 'Firefox'
        WHEN user_agent ~* 'Safari' THEN 'Safari'
        WHEN user_agent ~* 'Edge' THEN 'Edge'
        WHEN user_agent ~* 'Opera' THEN 'Opera'
        WHEN user_agent ~* 'MSIE' THEN 'Internet Explorer'
        WHEN user_agent ~* 'bot' OR user_agent ~* 'crawler' OR user_agent ~* 'spider'
        THEN 'Bot/Crawler'
        ELSE 'Other'
    END as browser_type,
    COUNT(*) as visit_count,
    COUNT(DISTINCT ip) as unique_visitors,
    MIN(time) as first_visit,
    MAX(time) as last_visit
FROM logs_visit_access
WHERE time >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY browser_type
ORDER BY visit_count DESC;
```

**智能分类规则**：
- 正则表达式匹配主流浏览器
- 自动识别爬虫和机器人
- 统计真实用户访问情况

### 6. 实时统计函数模式

**实时数据分析函数**：
```sql
-- 实时统计函数
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
```

**灵活时间窗口分析**：
- 支持自定义时间窗口统计
- 实时计算访问量和访客数
- JSONB格式返回结构化数据

### 7. 热门内容分析模式

**页面热度分析函数**：
```sql
-- 热门页面分析函数
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
```

**动态热度排序**：
- 按访问量和独立访客数排序
- 支持自定义时间范围
- 可配置返回结果数量

### 8. 访问趋势分析模式

**时间序列分析函数**：
```sql
-- 访问趋势分析函数
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
```

**趋势可视化支持**：
- 按日期聚合访问数据
- 支持访问量和访客数双维度
- 时间序列数据便于图表展示

### 9. 数据生命周期管理模式

**自动清理机制**：
```sql
-- 数据清理函数
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
```

**数据保留策略**：
- 默认保留90天历史数据
- 支持自定义保留期限
- 异常处理确保数据安全

### 10. 聚合数据优化模式

**数据聚合函数**：
```sql
-- 每日数据聚合函数
CREATE OR REPLACE FUNCTION aggregate_daily_stats(
    p_target_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
BEGIN
    -- 将当日数据聚合到统计表
    -- 为性能优化准备聚合数据
    RAISE NOTICE '日期 % 的访问日志聚合完成', p_target_date;
END;
$$ LANGUAGE plpgsql;
```

**性能优化策略**：
- 原始日志用于详细分析
- 聚合数据用于快速查询
- 视图提供预计算结果

## 模块功能使用方式

### 1. 前端界面集成
- **调用入口**：VisitTracker组件自动嵌入页面布局
- **参数传递格式**：通过配置对象传递追踪选项和采样率
- **交互反馈机制**：静默运行，不影响用户体验，支持调试模式显示追踪状态

### 2. 后端接口调用
- **服务初始化方式**：通过中间件自动初始化追踪服务
- **API签名示例**：
  ```go
  // 记录访问日志
  visitService.RecordLog(ctx, &VisitLog{
      IP: clientIP,
      UserAgent: userAgent,
      Path: requestPath,
      Method: method,
  })

  // 获取访问统计
  visitService.GetAnalytics(ctx, "daily", time.Now())

  // 获取实时监控数据
  visitService.GetRealTimeMetrics(ctx)
  ```
- **异步处理约定**：使用goroutine异步处理，不阻塞主请求流程

### 3. 前端追踪配置
```typescript
// 自动追踪配置
VisitTracker.init({
  endpoint: '/api/visit/log',
  sampleRate: 1.0,        // 采样率100%
  batchSize: 10,          // 批量发送大小
  flushInterval: 5000,     // 5秒刷新间隔
  enableRealTime: true,    // 启用实时监控
  debug: false             // 调试模式
})
```

## 第三方组件与数据库设计

### 1. 第三方组件
| 组件名称 | 版本 | 在模块中的具体作用 |
|---------|------|------------------|
| GoFrame | v2.9.3 | Web框架，提供中间件、数据库、缓存等功能 |
| PostgreSQL | 18 | 主数据库，存储访问日志和统计数据 |
| WebSocket | HTML5 | 实时数据推送，支持实时监控面板 |
| Chart.js | 可选 | 数据可视化，展示统计图表 |
| Arco Design | 2.66.5 | 前端UI组件库，提供仪表板组件 |

### 2. 数据库设计
#### 访问日志主表：logs_visit_access
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| visit_id | UUID | UNIQUE NOT NULL | 访问唯一标识 |
| ip_address | INET | | 客户端IP地址 |
| user_agent | TEXT | | 用户代理字符串 |
| request_method | VARCHAR(10) | | HTTP请求方法 |
| request_path | VARCHAR(500) | | 请求路径 |
| referer | TEXT | | 来源页面 |
| request_headers | JSONB | | 请求头信息 |
| response_status | INTEGER | | HTTP响应状态码 |
| response_time | INTEGER | | 响应时间（毫秒） |
| content_length | BIGINT | | 响应内容长度 |
| session_id | VARCHAR(100) | | 会话标识 |
| user_id | BIGINT | | 用户ID（如果有） |
| device_type | VARCHAR(50) | | 设备类型 |
| browser_name | VARCHAR(100) | | 浏览器名称 |
| os_name | VARCHAR(100) | | 操作系统名称 |
| country | VARCHAR(2) | | 国家代码 |
| city | VARCHAR(100) | | 城市名称 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 访问时间 |

#### 页面统计表：analytics_pages
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| page_path | VARCHAR(500) | UNIQUE NOT NULL | 页面路径 |
| page_title | VARCHAR(200) | | 页面标题 |
| total_visits | BIGINT | DEFAULT 0 | 总访问次数 |
| unique_visitors | BIGINT | DEFAULT 0 | 独立访客数 |
| bounce_rate | DECIMAL(5,2) | DEFAULT 0 | 跳出率 |
| avg_time_on_page | INTEGER | DEFAULT 0 | 平均停留时间 |
| last_visit | TIMESTAMPTZ | | 最后访问时间 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

#### 设备统计表：analytics_devices
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| device_type | VARCHAR(50) | NOT NULL | 设备类型 |
| browser_name | VARCHAR(100) | NOT NULL | 浏览器名称 |
| browser_version | VARCHAR(50) | | 浏览器版本 |
| os_name | VARCHAR(100) | NOT NULL | 操作系统名称 |
| os_version | VARCHAR(50) | | 操作系统版本 |
| visit_count | BIGINT | DEFAULT 0 | 访问次数 |
| unique_visitors | BIGINT | DEFAULT 0 | 独立访客数 |
| first_seen | TIMESTAMPTZ | DEFAULT NOW() | 首次发现时间 |
| last_seen | TIMESTAMPTZ | DEFAULT NOW() | 最后发现时间 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

#### 实时统计表：analytics_realtime
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| metric_key | VARCHAR(100) | UNIQUE NOT NULL | 指标键名 |
| metric_value | BIGINT | DEFAULT 0 | 指标值 |
| metric_type | VARCHAR(20) | DEFAULT 'counter' | 指标类型 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

### 3. 索引设计
- `idx_visit_access_ip_address`：IP地址索引，用于地理分析
- `idx_visit_access_created_at`：访问时间索引，用于时间范围查询
- `idx_visit_access_session_id`：会话ID索引，用于用户轨迹分析
- `idx_visit_access_page_path`：页面路径索引，用于页面分析
- `idx_analytics_pages_total_visits`：访问次数索引，用于热门页面排序
- `idx_analytics_devices_device_type`：设备类型索引，用于设备分析

### 4. 实时监控数据结构
```go
type RealTimeMetrics struct {
    ActiveUsers      int64     `json:"activeUsers"`      // 当前活跃用户数
    CurrentVisits    int64     `json:"currentVisits"`    // 当前访问量
    RequestsPerMin   int64     `json:"requestsPerMin"`   // 每分钟请求数
    AvgResponseTime  int64     `json:"avgResponseTime"`  // 平均响应时间
    ErrorRate        float64   `json:"errorRate"`        // 错误率
    TopPages         []PageStat `json:"topPages"`         // 热门页面
    RecentActivity   []Activity `json:"recentActivity"`  // 最近活动
    LastUpdated      time.Time `json:"lastUpdated"`      // 最后更新时间
}

type Activity struct {
    Path        string    `json:"path"`        // 访问路径
    IP          string    `json:"ip"`          // IP地址
    UserAgent   string    `json:"userAgent"`   // 用户代理
    Timestamp   time.Time `json:"timestamp"`   // 访问时间
}
```

### 5. 访问日志数据结构
```go
type VisitLog struct {
    VisitID       string                 `json:"visitId"`       // 访问唯一标识
    Timestamp     time.Time             `json:"timestamp"`     // 访问时间
    IPAddress    string                 `json:"ipAddress"`    // IP地址
    UserAgent     string                 `json:"userAgent"`     // 用户代理
    Method        string                 `json:"method"`        // HTTP方法
    Path          string                 `json:"path"`          // 请求路径
    Referer       string                 `json:"referer"`       // 来源页面
    ResponseTime  int                    `json:"responseTime"`  // 响应时间
    StatusCode    int                    `json:"statusCode"`    // 响应状态码
    ContentLength int64                  `json:"contentLength"` // 内容长度
    SessionID     string                 `json:"sessionId"`     // 会话标识
    UserID        *int64                 `json:"userId"`        // 用户ID
    Headers       map[string]interface{} `json:"headers"`       // 请求头
    Device        DeviceInfo             `json:"device"`        // 设备信息
}

type DeviceInfo struct {
    Type        string `json:"type"`        // 设备类型（mobile/desktop/tablet）
    Browser     string `json:"browser"`     // 浏览器名称
    Version     string `json:"version"`     // 浏览器版本
    OS          string `json:"os"`          // 操作系统
    OSVersion   string `json:"osVersion"`   // 操作系统版本
    Screen      string `json:"screen"`      // 屏幕分辨率
    Language    string `json:"language"`    // 语言设置
}
```

### 6. 统计分析数据结构
```go
type PageAnalytics struct {
    Path             string    `json:"path"`             // 页面路径
    Title            string    `json:"title"`            // 页面标题
    TotalVisits      int64     `json:"totalVisits"`      // 总访问次数
    UniqueVisitors   int64     `json:"uniqueVisitors"`   // 独立访客数
    BounceRate       float64   `json:"bounceRate"`       // 跳出率
    AvgTimeOnPage    int       `json:"avgTimeOnPage"`    // 平均停留时间
    ExitRate        float64   `json:"exitRate"`        // 退出率
    ConversionRate   float64   `json:"conversionRate"`   // 转化率
    LastVisit        time.Time `json:"lastVisit"`        // 最后访问时间
    TrendData       []TrendData `json:"trendData"`       // 趋势数据
}
```