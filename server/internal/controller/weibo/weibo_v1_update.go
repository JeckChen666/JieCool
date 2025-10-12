package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error) {
	version, err := service.Weibo().Update(ctx, req)
	if err != nil {
		return nil, gerror.Wrap(err, "更新微博失败")
	}
	return &v1.UpdateRes{Updated: true, SnapshotVersion: version}, nil
}
