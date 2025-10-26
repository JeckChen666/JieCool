package file

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/file/v1"
	"server/internal/service"
)

// GetFileList 获取文件列表
func (c *ControllerV1) GetFileList(ctx context.Context, req *v1.GetFileListReq) (res *v1.GetFileListRes, err error) {
	// 设置默认分页参数
	page := req.Page
	if page <= 0 {
		page = 1
	}

	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100 // 限制最大页面大小
	}

	// 调用服务层获取文件列表
	files, total, err := service.File().GetFileList(ctx, page, pageSize, req.Category, "", req.Extension)
	if err != nil {
		return nil, gerror.Wrap(err, "获取文件列表失败")
	}

	// 转换为响应格式
	var fileList []v1.FileListItem
	for _, file := range files {
		fileItem := v1.FileListItem{
			Id:            file.Id,
			FileUuid:      file.FileUuid,
			FileName:      file.FileName,
			FileExtension: file.FileExtension,
			FileSize:      file.FileSize,
			MimeType:      file.MimeType,
			FileMd5:       file.FileMd5,
			FileCategory:  file.FileCategory,
			HasThumbnail:  file.HasThumbnail,
			DownloadCount: file.DownloadCount,
			CreatedAt:     file.CreatedAt.String(),
			DownloadUrl:   fmt.Sprintf("/file/download/%s", file.FileUuid),
		}

		// 处理最后下载时间
		if file.LastDownloadAt != nil {
			fileItem.LastDownloadAt = file.LastDownloadAt.String()
		}

		// 处理缩略图
		if file.HasThumbnail {
			fileItem.ThumbnailUrl = fmt.Sprintf("/file/thumbnail/%s", file.FileUuid)
		}

		fileList = append(fileList, fileItem)
	}

	// 计算分页信息
	totalPages := (int64(total) + int64(pageSize) - 1) / int64(pageSize)

	return &v1.GetFileListRes{
		List:       fileList,
		Total:      int64(total),
		Page:       page,
		PageSize:   pageSize,
		TotalPages: int(totalPages),
	}, nil
}
