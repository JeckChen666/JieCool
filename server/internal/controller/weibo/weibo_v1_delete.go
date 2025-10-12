package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error) {
	if err := service.Weibo().Delete(ctx, req.Id); err != nil {
		return nil, gerror.Wrap(err, "删除微博失败")
	}
	return &v1.DeleteRes{Ok: true}, nil
}
