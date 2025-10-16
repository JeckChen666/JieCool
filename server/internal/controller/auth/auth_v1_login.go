package auth

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/auth/v1"
	srvAuth "server/internal/service/auth"
	"server/internal/service/configcache"
)

// 简单密码校验：从动态配置读取 core/dev/keyPassword，与请求密码匹配即登录成功
// 成功后签发 JWT（HS256），密钥从动态配置 auth/<env>/jwt_secret 读取
func (c *ControllerV1) Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error) {
	// 从缓存读取密码
	item, ok := configcache.Get(ctx, "core", "dev", "keyPassword")
	if !ok {
		return nil, gerror.New("password not configured")
	}
	pass, _ := item.Value.(string)
	// value 为 JSON 字符串，可能包含引号，做兼容处理
	pass = strings.Trim(pass, " \t\r\n\"")
	if pass == "" {
		return nil, gerror.New("password empty")
	}
	if strings.TrimSpace(req.Password) != pass {
		return nil, gerror.New("invalid password")
	}
	// 登录成功，签发 JWT。默认 12 小时；若提供 TTL 且当前非生产环境，则使用 TTL（限制范围 1~7200 秒）
	var ttl int64 = int64(12 * 3600)
	// 读取当前环境
	env := ""
	if v, _ := g.Cfg().Get(ctx, "env"); v != nil && v.String() != "" {
		env = v.String()
	}
	if env == "" {
		if v2, _ := g.Cfg().Get(ctx, "app.env"); v2 != nil && v2.String() != "" {
			env = v2.String()
		}
	}
	if env == "" {
		env = "default"
	}
	if req.TTL > 0 && strings.ToLower(env) != "prod" {
		if req.TTL > 7200 {
			ttl = int64(7200)
		} else {
			ttl = int64(req.TTL)
		}
	}
	token, exp, err := srvAuth.GenerateToken(ctx, ttl)
	if err != nil {
		return nil, err
	}

	// 初始化 password_updated_at（若尚未设置），用于统一令牌失效控制
	if _, ok := configcache.Get(ctx, "auth", env, "password_updated_at"); !ok {
		// 直接写入配置表作为初始化
		_, _ = g.DB().Ctx(ctx).Model("dynamic_configs").Where(g.Map{
			"namespace": "auth",
			"env":       env,
			"key":       "password_updated_at",
		}).Save(g.Map{
			"namespace":   "auth",
			"env":         env,
			"key":         "password_updated_at",
			"type":        "number",
			"value":       exp,
			"enabled":     true,
			"version":     1,
			"description": "password last updated timestamp (auto init)",
		})
		// 重建缓存以生效
		_, _, _ = configcache.Rebuild(ctx)
	}

	return &v1.LoginRes{Token: token, ExpiresAt: exp}, nil
}
