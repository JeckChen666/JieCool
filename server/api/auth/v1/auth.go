package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// 登录请求
type LoginReq struct {
	g.Meta   `path:"/auth/login" tags:"Auth" method:"post" summary:"Password login" noAuth:"true"`
	Password string `json:"password" v:"required"`
	// 可选：令牌有效期（秒）。仅非生产环境生效，用于测试 token 过期场景。
	TTL int `json:"ttl" v:"min:1"`
}

type LoginRes struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expiresAt"`
}

// 获取当前用户
type MeReq struct {
	g.Meta `path:"/auth/me" tags:"Auth" method:"get" summary:"Get current user info"`
}

type UserInfo struct {
	Username string   `json:"username"`
	Roles    []string `json:"roles"`
}

type MeRes struct {
	User *UserInfo `json:"user"`
}

// IAuthV1 接口声明
type IAuthV1 interface {
	Login(ctx g.Ctx, req *LoginReq) (res *LoginRes, err error)
	Me(ctx g.Ctx, req *MeReq) (res *MeRes, err error)
	Logout(ctx g.Ctx, req *LogoutReq) (res *LogoutRes, err error)
}

// 登出当前会话（需登录）
type LogoutReq struct {
	g.Meta `path:"/auth/logout" tags:"Auth" method:"post" summary:"Logout current session"`
}

type LogoutRes struct {
	LoggedOut bool `json:"loggedOut"`
}

// 生成URL token（用于URL携带登录）
type GenerateUrlTokenReq struct {
	g.Meta      `path:"/auth/generate-url-token" tags:"Auth" method:"post" summary:"Generate URL token for login"`
	Description string `json:"description" dc:"生成token的用途描述"`
	TTL         int    `json:"ttl" dc:"token有效期（秒），0表示使用默认配置"`
}

type GenerateUrlTokenRes struct {
	Token     string `json:"token" dc:"生成的JWT token"`
	ExpiresAt int64  `json:"expires_at" dc:"令牌过期时间戳（秒）"`
	LoginUrl  string `json:"login_url" dc:"包含token的登录URL"`
}
