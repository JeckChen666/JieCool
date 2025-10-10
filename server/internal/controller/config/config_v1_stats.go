package config

import (
	"context"

	v1 "server/api/config/v1"
	"server/internal/service/configcache"
)

// Stats 返回当前缓存条目统计
func (c *ControllerV1) Stats(ctx context.Context, req *v1.StatsReq) (res *v1.StatsRes, err error) {
	count := configcache.Stats()
	return &v1.StatsRes{Entries: count}, nil
}