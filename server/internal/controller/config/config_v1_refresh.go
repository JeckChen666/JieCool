package config

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/config/v1"
	"server/internal/service/configcache"
)

func (c *ControllerV1) Refresh(ctx context.Context, req *v1.RefreshReq) (res *v1.RefreshRes, err error) {
	// 仅管理员可执行
	r := g.RequestFromCtx(ctx)
	subj := r.GetCtxVar("auth.subject").String()
	if subj == "" || subj != "admin" {
		return nil, gerror.New("forbidden")
	}
	entries, elapsed, rebuildErr := configcache.Rebuild(ctx)
	if rebuildErr != nil {
		g.Log().Error(ctx, "Config cache rebuild failed:", rebuildErr)
		return &v1.RefreshRes{
			Status:    "failed",
			Entries:   0,
			ElapsedMs: elapsed.Milliseconds(),
		}, gerror.NewCode(gcode.CodeInternalError, rebuildErr.Error())
	}
	return &v1.RefreshRes{
		Status:    "ok",
		Entries:   entries,
		ElapsedMs: elapsed.Milliseconds(),
	}, nil
}
