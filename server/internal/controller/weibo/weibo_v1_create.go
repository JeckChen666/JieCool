package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error) {
	id, createdAt, err := service.Weibo().Create(ctx, req)
	if err != nil {
		return nil, gerror.Wrap(err, "创建微博失败")
	}
	return &v1.CreateRes{Id: id, CreatedAt: createdAt}, nil
}
