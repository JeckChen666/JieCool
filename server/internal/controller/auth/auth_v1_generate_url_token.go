package auth

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/auth/v1"
	srvAuth "server/internal/service/auth"
	"server/internal/service/configcache"
)

// GenerateUrlToken 生成用于URL携带的登录token
func (c *ControllerV1) GenerateUrlToken(ctx context.Context, req *v1.GenerateUrlTokenReq) (res *v1.GenerateUrlTokenRes, err error) {
	// 获取TTL配置，优先使用请求参数，否则使用动态配置
	var ttl int64
	if req.TTL > 0 {
		ttl = int64(req.TTL)
	} else {
		// 从动态配置中获取默认TTL（秒）
		configItem, found := configcache.Get(ctx, "auth", "default", "url_token_ttl")
		if found && configItem.Value != nil {
			if ttlValue, ok := configItem.Value.(float64); ok {
				ttl = int64(ttlValue)
			} else {
				// 默认值：1小时
				ttl = 3600
			}
		} else {
			// 默认值：1小时
			ttl = 3600
		}
	}

	// 生成token
	token, expiresAt, err := srvAuth.GenerateToken(ctx, ttl)
	if err != nil {
		g.Log().Errorf(ctx, "GenerateUrlToken failed: %v", err)
		return nil, err
	}

	// 构造登录URL
	// 从动态配置中获取前端域名
	frontendDomain := "http://localhost:3000" // 默认值
	configItem, found := configcache.Get(ctx, "auth", "default", "frontend_domain")
	if found && configItem.Value != nil {
		if domain, ok := configItem.Value.(string); ok && domain != "" {
			frontendDomain = domain
		}
	}

	loginUrl := fmt.Sprintf("%s?token=%s", frontendDomain, token)

	// 记录日志
	g.Log().Infof(ctx, "URL token generated: description=%s, ttl=%d, expires_at=%d",
		req.Description, ttl, expiresAt)
	// TODO: 添加 token_via 字段处理
	// g.Log().Infof(ctx, "token_via: %s", req.TokenVia)

	return &v1.GenerateUrlTokenRes{
		Token:     token,
		ExpiresAt: expiresAt,
		LoginUrl:  loginUrl,
	}, nil
}
