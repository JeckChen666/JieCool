package file

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/file/v1"
	"server/internal/service"
)

// DeleteFile 删除文件
func (c *ControllerV1) DeleteFile(ctx context.Context, req *v1.DeleteFileReq) (res *v1.DeleteFileRes, err error) {
	// 调用服务层删除文件
	err = service.File().DeleteFile(ctx, req.FileUuid)
	if err != nil {
		return nil, gerror.Wrap(err, "删除文件失败")
	}

	return &v1.DeleteFileRes{
		Success: true,
		Message: "文件删除成功",
	}, nil
}
