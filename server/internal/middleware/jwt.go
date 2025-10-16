package middleware

import (
	"strings"

	"github.com/gogf/gf/v2/net/ghttp"

	"server/internal/service/auth"
)

// getMetaTag 安全读取当前路由处理函数的 g.Meta 标签
func getMetaTag(r *ghttp.Request, key string) string {
	hi := r.GetServeHandler()
	if hi == nil {
		return ""
	}
	// GoFrame 提供 HandlerItem.GetMetaTag 方法
	return hi.GetMetaTag(key)
}

// MiddlewareJWT 基于 g.Meta 的 noAuth 标签跳过鉴权；否则校验 Authorization/Bearer 或 URL token
func MiddlewareJWT(r *ghttp.Request) {
	// 允许公开接口：noAuth:"true"
	if strings.EqualFold(getMetaTag(r, "noAuth"), "true") {
		r.Middleware.Next()
		return
	}

	// 读取令牌：优先 URL token（静默登录），其次 Authorization 头
	token := r.GetQuery("token").String()
	if token == "" {
		authz := r.Header.Get("Authorization")
		if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			token = strings.TrimSpace(authz[7:])
		}
	}
	if token == "" {
		r.Response.WriteStatusExit(401)
		return
	}

	// 校验令牌
	claims, err := auth.ValidateToken(r.GetCtx(), token)
	if err != nil || claims == nil {
		r.Response.WriteStatusExit(401)
		return
	}

	// 注入上下文，便于控制器读取
	r.SetCtxVar("auth.subject", claims.Subject)
	iat := int64(0)
	exp := int64(0)
	if claims.IssuedAt != nil {
		iat = claims.IssuedAt.Unix()
	}
	if claims.ExpiresAt != nil {
		exp = claims.ExpiresAt.Unix()
	}
	r.SetCtxVar("auth.iat", iat)
	r.SetCtxVar("auth.exp", exp)
	// 标记 token 来源
	if r.GetQuery("token").String() != "" {
		r.SetCtxVar("auth.via", "url")
	} else {
		r.SetCtxVar("auth.via", "header")
	}

	r.Middleware.Next()
}
