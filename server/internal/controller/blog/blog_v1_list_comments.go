package blog

import (
	"context"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/blog/v1"
)

func (c *ControllerV1) ListComments(ctx context.Context, req *v1.ListCommentsReq) (res *v1.ListCommentsRes, err error) {
	return nil, gerror.NewCode(gcode.CodeNotImplemented)
}
