package file

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/file/v1"
	"server/internal/service"
)

// GetFileInfo 获取文件信息
func (c *ControllerV1) GetFileInfo(ctx context.Context, req *v1.GetFileInfoReq) (res *v1.GetFileInfoRes, err error) {
	// 获取文件信息
	fileEntity, err := service.File().GetFileByUUID(ctx, req.FileUuid)
	if err != nil {
		return nil, gerror.Wrap(err, "获取文件信息失败")
	}

	if fileEntity == nil {
		return nil, gerror.New("文件不存在")
	}

	// 构造响应
	res = &v1.GetFileInfoRes{
		Id:            fileEntity.Id,
		FileUuid:      fileEntity.FileUuid,
		FileName:      fileEntity.FileName,
		FileExtension: fileEntity.FileExtension,
		FileSize:      fileEntity.FileSize,
		MimeType:      fileEntity.MimeType,
		FileCategory:  fileEntity.FileCategory,
		FileHash:      fileEntity.FileHash,
		FileMd5:       fileEntity.FileMd5,
		HasThumbnail:  fileEntity.HasThumbnail,
		DownloadCount: fileEntity.DownloadCount,
		FileStatus:    fileEntity.FileStatus,
		CreatedAt:     fileEntity.CreatedAt.String(),
		UpdatedAt:     fileEntity.UpdatedAt.String(),
		DownloadUrl:   fmt.Sprintf("/api/v1/file/download/%s", fileEntity.FileUuid),
	}

	// 处理最后下载时间
	if fileEntity.LastDownloadAt != nil {
		res.LastDownloadAt = fileEntity.LastDownloadAt.String()
	}

	// 处理缩略图
	if fileEntity.HasThumbnail {
		res.ThumbnailUrl = fmt.Sprintf("/api/v1/file/thumbnail/%s", fileEntity.FileUuid)
	}

	return res, nil
}
