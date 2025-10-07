package file

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	v1 "server/api/file/v1"
	"server/internal/service"
)

// GetFileMd5 获取文件MD5哈希值
func (c *ControllerV1) GetFileMd5(ctx context.Context, req *v1.GetFileMd5Req) (res *v1.GetFileMd5Res, err error) {
	// 根据UUID获取文件信息
	fileEntity, err := service.File().GetFileByUUID(ctx, req.FileUuid)
	if err != nil {
		return nil, gerror.Wrap(err, "获取文件信息失败")
	}

	if fileEntity == nil {
		return nil, gerror.New("文件不存在")
	}

	// 检查文件状态
	if fileEntity.FileStatus != "active" {
		return nil, gerror.New("文件不可用")
	}

	// 构造响应
	res = &v1.GetFileMd5Res{
		FileUuid: fileEntity.FileUuid,
		FileName: fileEntity.FileName,
		FileMd5:  fileEntity.FileMd5,
		FileSize: fileEntity.FileSize,
	}

	return res, nil
}