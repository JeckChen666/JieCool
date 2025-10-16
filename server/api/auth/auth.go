// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package auth

import (
	"context"

	"server/api/auth/v1"
)

type IAuthV1 interface {
	Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error)
	Me(ctx context.Context, req *v1.MeReq) (res *v1.MeRes, err error)
	Logout(ctx context.Context, req *v1.LogoutReq) (res *v1.LogoutRes, err error)
	GenerateUrlToken(ctx context.Context, req *v1.GenerateUrlTokenReq) (res *v1.GenerateUrlTokenRes, err error)
}
