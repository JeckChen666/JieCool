package file

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/file/v1"
	"server/internal/service"
)

// GetFileInfoByID 根据文件ID获取文件信息
func (c *ControllerV1) GetFileInfoByID(ctx context.Context, req *v1.GetFileInfoByIDReq) (res *v1.GetFileInfoByIDRes, err error) {
	fileEntity, err := service.File().GetFileByID(ctx, req.Id)
	if err != nil {
		return nil, gerror.Wrap(err, "查询文件信息失败")
	}

	res = &v1.GetFileInfoByIDRes{
		Id:              fileEntity.Id,
		FileUuid:        fileEntity.FileUuid,
		FileName:        fileEntity.FileName,
		FileExtension:   fileEntity.FileExtension,
		FileSize:        fileEntity.FileSize,
		MimeType:        fileEntity.MimeType,
		FileCategory:    fileEntity.FileCategory,
		FileHash:        fileEntity.FileHash,
		FileMd5:         fileEntity.FileMd5,
		HasThumbnail:    fileEntity.HasThumbnail,
		ThumbnailWidth:  fileEntity.ThumbnailWidth,
		ThumbnailHeight: fileEntity.ThumbnailHeight,
		DownloadCount:   fileEntity.DownloadCount,
		Metadata:        fileEntity.Metadata,
		FileStatus:      fileEntity.FileStatus,
		CreatedAt: func() string {
			if fileEntity.CreatedAt != nil {
				return fileEntity.CreatedAt.String()
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if fileEntity.UpdatedAt != nil {
				return fileEntity.UpdatedAt.String()
			}
			return ""
		}(),
		DownloadUrl: fmt.Sprintf("/api/v1/file/download/%s", fileEntity.FileUuid),
	}
	if fileEntity.HasThumbnail {
		res.ThumbnailUrl = fmt.Sprintf("/api/v1/file/thumbnail/%s", fileEntity.FileUuid)
	}
	return res, nil
}
