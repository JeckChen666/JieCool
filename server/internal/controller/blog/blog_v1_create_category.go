package blog

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/blog/v1"
)

func (c *ControllerV1) CreateCategory(ctx context.Context, req *v1.CreateCategoryReq) (res *v1.CreateCategoryRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
