package auth

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	v1 "server/api/auth/v1"
	srvAuth "server/internal/service/auth"
)

// 校验 Bearer JWT 并返回当前用户信息
func (c *ControllerV1) Me(ctx context.Context, req *v1.MeReq) (res *v1.MeRes, err error) {
	r := g.RequestFromCtx(ctx)
	authz := r.Header.Get("Authorization")
	if len(authz) < 8 || strings.ToLower(authz[0:7]) != "bearer " {
		return nil, gerror.New("missing bearer token")
	}
	token := strings.TrimSpace(authz[7:])
	claims, err := srvAuth.ValidateToken(ctx, token)
	if err != nil || claims == nil {
		return nil, gerror.New("invalid token")
	}

	return &v1.MeRes{User: &v1.UserInfo{Username: claims.Subject, Roles: []string{"admin"}}}, nil
}
