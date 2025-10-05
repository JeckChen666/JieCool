package service

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// VisitAccessInfo 描述一次访问的关键信息
type VisitAccessInfo struct {
	TimeRFC3339 string            `json:"time"`      // 访问时间（RFC3339Nano）
	IP          string            `json:"ip"`        // 客户端IP（若无法获取则为空）
	UserAgent   string            `json:"userAgent"` // UA
	Method      string            `json:"method"`    // 请求方法
	Path        string            `json:"path"`      // 请求路径
	Headers     map[string]string `json:"headers"`   // 扁平化请求头
}

// SaveAccess 优先持久化到 PostgreSQL；若数据库不可用或写入失败则降级写入到 data/visit.log。
func SaveAccess(ctx context.Context, info *VisitAccessInfo) error {
	if info == nil {
		return fmt.Errorf("nil VisitAccessInfo")
	}
	// 尝试写入数据库（PostgreSQL）
	if db := g.DB(); db != nil {
		// 将 RFC3339 时间解析为 time.Time，以便写入 timestamptz
		var t time.Time
		if info.TimeRFC3339 != "" {
			if parsed, err := time.Parse(time.RFC3339Nano, info.TimeRFC3339); err == nil {
				t = parsed
			}
		}
		headersJSON, _ := json.Marshal(info.Headers)
		_, err := db.Model("logs_visit_access").Insert(g.Map{
			"time":       t,
			"ip":         info.IP,
			"user_agent": info.UserAgent,
			"method":     info.Method,
			"path":       info.Path,
			"headers":    string(headersJSON),
		})
		if err == nil {
			return nil
		}
		g.Log().Warning(ctx, "SaveAccess: DB insert failed, fallback to file", err)
	} else {
		g.Log().Warning(ctx, "SaveAccess: DB is not configured, fallback to file")
	}
	// 确保目录存在
	dir := filepath.Join("data")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create data dir: %w", err)
	}
	// 以追加模式写入 JSON 行
	file := filepath.Join(dir, "visit.log")
	f, err := os.OpenFile(file, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o644)
	if err != nil {
		return fmt.Errorf("open visit.log: %w", err)
	}
	defer f.Close()
	b, err := json.Marshal(info)
	if err != nil {
		return fmt.Errorf("marshal visit info: %w", err)
	}
	if _, err = f.Write(append(b, '\n')); err != nil {
		return fmt.Errorf("write visit info: %w", err)
	}
	return nil
}
