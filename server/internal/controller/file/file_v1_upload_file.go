package file

import (
	"context"
	"fmt"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"server/api/file/v1"
	"server/internal/service"
)

// UploadFile 上传文件
func (c *ControllerV1) UploadFile(ctx context.Context, req *v1.UploadFileReq) (res *v1.UploadFileRes, err error) {
	// 获取HTTP请求对象
	r := g.RequestFromCtx(ctx)
	if r == nil {
		return nil, gerror.New("无法获取HTTP请求对象")
	}

	// 获取上传的文件
	file := r.GetUploadFile("file")
	if file == nil {
		return nil, gerror.New("未找到上传的文件，请确保表单字段名为'file'")
	}

	// 获取上传者信息
	uploaderIP := r.GetClientIp()
	userAgent := r.Header.Get("User-Agent")
	
	// 如果没有指定分类，使用默认分类
	category := req.Category
	if category == "" {
		category = "general"
	}

	// 调用服务层上传文件
	fileEntity, err := service.File().UploadFile(ctx, file.FileHeader, category, 0, uploaderIP, userAgent)
	if err != nil {
		return nil, gerror.Wrap(err, "文件上传失败")
	}

	// 构造响应
	res = &v1.UploadFileRes{
		FileUuid:      fileEntity.FileUuid,
		FileName:      fileEntity.FileName,
		FileSize:      fileEntity.FileSize,
		FileExtension: fileEntity.FileExtension,
		MimeType:      fileEntity.MimeType,
		FileMd5:       fileEntity.FileMd5,  // 添加MD5哈希值
		HasThumbnail:  fileEntity.HasThumbnail,
		DownloadUrl:   fmt.Sprintf("/api/v1/file/download/%s", fileEntity.FileUuid),
	}

	// 如果有缩略图，添加缩略图URL
	if fileEntity.HasThumbnail {
		res.ThumbnailUrl = fmt.Sprintf("/api/v1/file/thumbnail/%s", fileEntity.FileUuid)
	}

	return res, nil
}
