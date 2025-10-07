package file

import (
	"context"
	"fmt"
	"strconv"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"server/api/file/v1"
	"server/internal/service"
)

// GetThumbnail 获取文件缩略图
func (c *ControllerV1) GetThumbnail(ctx context.Context, req *v1.GetThumbnailReq) (res *v1.GetThumbnailRes, err error) {
	// 获取HTTP请求对象
	r := g.RequestFromCtx(ctx)
	if r == nil {
		return nil, gerror.New("无法获取HTTP请求对象")
	}

	// 获取文件信息
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

	// 获取缩略图
	thumbnailData, width, height, err := service.File().GetThumbnail(ctx, req.FileUuid, req.Width, req.Height)
	if err != nil {
		return nil, gerror.Wrap(err, "获取缩略图失败")
	}

	if thumbnailData == nil {
		return nil, gerror.New("该文件不支持缩略图")
	}

	// 设置响应头
	response := r.Response
	
	// 设置内容类型为JPEG
	response.Header().Set("Content-Type", "image/jpeg")
	
	// 设置文件大小
	response.Header().Set("Content-Length", strconv.Itoa(len(thumbnailData)))
	
	// 设置缓存控制（缩略图缓存时间更长）
	response.Header().Set("Cache-Control", "public, max-age=604800") // 缓存7天
	
	// 生成ETag（基于文件UUID和尺寸）
	etag := fmt.Sprintf(`"%s-%dx%d"`, fileEntity.FileUuid, width, height)
	response.Header().Set("ETag", etag)
	
	// 检查是否为条件请求
	ifNoneMatch := r.Header.Get("If-None-Match")
	if ifNoneMatch == etag {
		response.WriteStatus(304) // Not Modified
		return &v1.GetThumbnailRes{}, nil
	}
	
	// 输出缩略图内容
	response.Write(thumbnailData)
	
	return &v1.GetThumbnailRes{}, nil
}
