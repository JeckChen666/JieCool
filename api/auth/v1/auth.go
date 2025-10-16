package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// 单用户登录，返回 JWT 令牌
type LoginReq struct {
	g.Meta   `path:"/auth/login" tags:"Auth" method:"post" summary:"Single-user login" noAuth:"true"`
	Password string `json:"password" v:"required" dc:"登录密码（与动态配置中的密码匹配）"`
}

type LoginRes struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at" dc:"令牌过期时间戳（秒）"`
}

// 获取当前登录用户信息（通过中间件注入）
type MeReq struct {
	g.Meta `path:"/auth/me" tags:"Auth" method:"get" summary:"Get current user info"`
}

type MeRes struct {
	Subject   string `json:"subject"`
	IssuedAt  int64  `json:"issued_at"`
	ExpiresAt int64  `json:"expires_at"`
	TokenVia  string `json:"token_via" dc:"token来源：header或url"`
}

// 用户登出
type LogoutReq struct {
	g.Meta `path:"/auth/logout" tags:"Auth" method:"post" summary:"User logout"`
}

type LogoutRes struct {
	Message string `json:"message" dc:"登出结果消息"`
}

// 生成URL token（用于URL携带登录）
type GenerateUrlTokenReq struct {
	g.Meta      `path:"/auth/generate-url-token" tags:"Auth" method:"post" summary:"Generate URL token for login"`
	Description string `json:"description" dc:"生成token的用途描述"`
	TTL         int    `json:"ttl" dc:"token有效期（秒），0表示使用默认配置"`
	TokenVia    string `json:"token_via" dc:"token使用方式，如url、header等"`
}

type GenerateUrlTokenRes struct {
	Token     string `json:"token" dc:"生成的JWT token"`
	ExpiresAt int64  `json:"expires_at" dc:"令牌过期时间戳（秒）"`
	LoginUrl  string `json:"login_url" dc:"包含token的登录URL"`
}

// IAuthV1 接口声明
type IAuthV1 interface {
	Login(ctx g.Ctx, req *LoginReq) (res *LoginRes, err error)
	Me(ctx g.Ctx, req *MeReq) (res *MeRes, err error)
	Logout(ctx g.Ctx, req *LogoutReq) (res *LogoutRes, err error)
	GenerateUrlToken(ctx g.Ctx, req *GenerateUrlTokenReq) (res *GenerateUrlTokenRes, err error)
}
