package file

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "server/api/file/v1"
	"server/internal/service"
)

// RestoreFile 恢复文件
func (c *ControllerV1) RestoreFile(ctx context.Context, req *v1.RestoreFileReq) (res *v1.RestoreFileRes, err error) {
	// 调用服务层恢复文件
	err = service.File().RestoreFile(ctx, req.FileUuid)
	if err != nil {
		return nil, gerror.Wrap(err, "恢复文件失败")
	}

	return &v1.RestoreFileRes{
		Success: true,
		Message: "文件恢复成功",
	}, nil
}