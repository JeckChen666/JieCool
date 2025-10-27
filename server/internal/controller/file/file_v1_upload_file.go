package file

import (
	"context"
	"fmt"
	"path/filepath"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"server/api/file/v1"
	"server/internal/service"
	"server/utility"
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

	// 处理文件分类
	var category string
	if req.Category != "" {
		// 使用用户指定的分类
		category = req.Category
	} else {
		// 自动检测文件分类
		extension := filepath.Ext(file.Filename)
		mimeType := utility.GetMimeTypeFromExtension(extension)
		// 如果HTTP头中有Content-Type，优先使用
		if headerType := file.Header.Get("Content-Type"); headerType != "" {
			mimeType = headerType
		}
		category = utility.DetectFileCategory(mimeType, extension)
		g.Log().Infof(ctx, "自动检测文件分类: 文件名=%s, MIME类型=%s, 扩展名=%s, 分类=%s",
			file.Filename, mimeType, extension, category)
	}

	// 调用服务层上传文件
	fileEntity, err := service.File().UploadFile(ctx, file.FileHeader, category, 0, uploaderIP, userAgent, req.ApplicationName)
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
		FileMd5:       fileEntity.FileMd5,
		HasThumbnail:  fileEntity.HasThumbnail,
		DownloadUrl:   fmt.Sprintf("/file/download/%s", fileEntity.FileUuid),
	}

	// 如果有缩略图，添加缩略图URL
	if fileEntity.HasThumbnail {
		res.ThumbnailUrl = fmt.Sprintf("/file/thumbnail/%s", fileEntity.FileUuid)
	}

	return res, nil
}
