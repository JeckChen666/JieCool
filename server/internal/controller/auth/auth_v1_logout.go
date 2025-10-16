package auth

import (
	"context"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	v1 "server/api/auth/v1"
	srvAuth "server/internal/service/auth"
)

// 登出当前会话：校验当前 Bearer Token 合法后返回成功。
// 目前为无状态实现，由前端清除本地令牌；如需强制失效可扩展黑名单或更新时间戳。
func (c *ControllerV1) Logout(ctx context.Context, req *v1.LogoutReq) (res *v1.LogoutRes, err error) {
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
	// 校验通过即认为登出成功（客户端清除令牌）
	return &v1.LogoutRes{LoggedOut: true}, nil
}
