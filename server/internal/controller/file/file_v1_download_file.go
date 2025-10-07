package file

import (
	"context"
	"crypto/md5"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"server/api/file/v1"
	"server/internal/service"
)

// DownloadFile 下载文件
func (c *ControllerV1) DownloadFile(ctx context.Context, req *v1.DownloadFileReq) (res *v1.DownloadFileRes, err error) {
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

	// 获取文件内容
	fileContent, fileName, mimeType, err := service.File().GetFileContent(ctx, req.FileUuid)
	if err != nil {
		return nil, gerror.Wrap(err, "获取文件内容失败")
	}
	
	// MD5完整性验证
	actualMD5 := fmt.Sprintf("%x", md5.Sum(fileContent))
	if actualMD5 != fileEntity.FileMd5 {
		g.Log().Error(ctx, "文件完整性验证失败:", 
			"fileUUID=", req.FileUuid,
			"storedMD5=", fileEntity.FileMd5,
			"actualMD5=", actualMD5,
			"fileName=", fileName)
		return nil, gerror.New("文件完整性验证失败，文件可能已损坏")
	}
	
	// 调试日志
	g.Log().Debug(ctx, "下载文件调试信息:", "fileName=", fileName, "mimeType=", mimeType, "MD5验证=", "通过")

	// 获取下载者信息
	downloaderIP := r.GetClientIp()
	userAgent := r.Header.Get("User-Agent")

	// 更新下载统计（已修复数据库错误）
	err = service.File().UpdateDownloadCount(ctx, req.FileUuid, downloaderIP, userAgent)
	if err != nil {
		// 记录错误但不影响下载
		g.Log().Error(ctx, "更新下载统计失败:", err)
	}

	// 设置响应头
	response := r.Response
	
	// 设置内容类型
	response.Header().Set("Content-Type", mimeType)
	
	// 设置文件大小
	response.Header().Set("Content-Length", strconv.FormatInt(fileEntity.FileSize, 10))
	
	// 设置缓存控制
	response.Header().Set("Cache-Control", "public, max-age=86400") // 缓存1天
	response.Header().Set("ETag", fmt.Sprintf(`"%s"`, fileEntity.FileHash))
	
	// 检查是否为条件请求
	ifNoneMatch := r.Header.Get("If-None-Match")
	if ifNoneMatch == fmt.Sprintf(`"%s"`, fileEntity.FileHash) {
		response.WriteStatus(304) // Not Modified
		return &v1.DownloadFileRes{}, nil
	}
	
	// 确保文件名包含扩展名
	finalFileName := fileName
	if fileEntity.FileExtension != "" && !strings.HasSuffix(strings.ToLower(fileName), "."+strings.ToLower(fileEntity.FileExtension)) {
		// 如果文件名不包含扩展名，则添加扩展名
		finalFileName = fileName + "." + fileEntity.FileExtension
	}
	
	// 设置文件名（支持中文文件名）
	encodedFileName := url.QueryEscape(finalFileName)
	response.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, finalFileName, encodedFileName))
	
	// 设置最后修改时间
	response.Header().Set("Last-Modified", fileEntity.UpdatedAt.Format(time.RFC1123))
	
	// 输出文件内容
	response.Write(fileContent)
	
	return &v1.DownloadFileRes{}, nil
}
