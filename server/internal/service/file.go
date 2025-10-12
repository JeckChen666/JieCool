package service

import (
	"context"
	"crypto/md5"
	"crypto/sha256"
	"fmt"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"
	"time"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/gogf/gf/v2/util/gconv"

	"server/internal/dao"
	"server/internal/model/do"
	"server/internal/model/entity"
	"server/utility"
)

// IFile 文件服务接口
type IFile interface {
	// UploadFile 上传文件
	UploadFile(ctx context.Context, file *multipart.FileHeader, category string, uploaderID int64, uploaderIP string, userAgent string) (*entity.Files, error)

	// GetFileByUUID 根据UUID获取文件
	GetFileByUUID(ctx context.Context, fileUUID string) (*entity.Files, error)

	// GetFileByID 根据ID获取文件
	GetFileByID(ctx context.Context, fileID int64) (*entity.Files, error)

	// GetFileContent 获取文件内容
	// 返回值：文件内容, 文件名, MIME类型, 错误
	GetFileContent(ctx context.Context, fileUUID string) ([]byte, string, string, error)

	// GetThumbnail 获取缩略图
	GetThumbnail(ctx context.Context, fileUUID string, width, height int) ([]byte, int, int, error)

	// GetFileList 获取文件列表
	GetFileList(ctx context.Context, page, pageSize int, category, status, extension string) ([]*entity.Files, int, error)

	// DeleteFile 删除文件
	DeleteFile(ctx context.Context, fileUUID string) error

	// RestoreFile 恢复已删除的文件
	RestoreFile(ctx context.Context, fileUUID string) error

	// GetFileStats 获取文件统计信息
	GetFileStats(ctx context.Context) (map[string]interface{}, error)

	// UpdateDownloadCount 更新下载次数
	UpdateDownloadCount(ctx context.Context, fileUUID string, downloaderIP string, userAgent string) error
}

type sFile struct{}

// File 文件服务实例
func File() IFile {
	return &sFile{}
}

// UploadFile 上传文件
func (s *sFile) UploadFile(ctx context.Context, file *multipart.FileHeader, category string, uploaderID int64, uploaderIP string, userAgent string) (*entity.Files, error) {
	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		return nil, gerror.Wrap(err, "打开上传文件失败")
	}
	defer src.Close()

	// 读取文件内容
	content, err := io.ReadAll(src)
	if err != nil {
		return nil, gerror.Wrap(err, "读取文件内容失败")
	}

	// 检查文件大小（限制为50MB）
	maxSize := int64(50 * 1024 * 1024) // 50MB
	if file.Size > maxSize {
		return nil, gerror.Newf("文件大小超过限制，最大允许50MB，当前文件大小: %d字节", file.Size)
	}

	// 获取文件扩展名和MIME类型
	extension := strings.ToLower(filepath.Ext(file.Filename))
	if extension != "" {
		extension = extension[1:] // 去掉点号
	}

	mimeType := utility.GetMimeTypeFromExtension(extension)
	if mimeType == "application/octet-stream" {
		// 尝试从HTTP头获取MIME类型
		mimeType = file.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
	}

	// 计算文件哈希（SHA256用于去重，MD5用于校验）
	sha256Hash := sha256.Sum256(content)
	fileHash := fmt.Sprintf("%x", sha256Hash)

	// 计算MD5哈希用于文件完整性校验
	md5Hash := md5.Sum(content)
	fileMd5 := fmt.Sprintf("%x", md5Hash)

	// 检查文件是否已存在（只检查状态为active的文件）
	existingFile, err := dao.Files.Ctx(ctx).Where("file_hash", fileHash).Where("file_status", "active").One()
	if err != nil {
		return nil, gerror.Wrap(err, "检查文件是否存在失败")
	}
	if !existingFile.IsEmpty() {
		// 文件已存在，返回现有文件信息
		var fileEntity entity.Files
		if err := existingFile.Struct(&fileEntity); err != nil {
			return nil, gerror.Wrap(err, "解析现有文件信息失败")
		}
		return &fileEntity, nil
	}

	// 处理缩略图（仅对图片文件）
	var thumbnailContent []byte
	var thumbnailWidth, thumbnailHeight int
	var hasThumbnail bool

	if utility.IsImageFile(mimeType) {
		processor := utility.NewImageProcessor()
		thumbnailContent, thumbnailWidth, thumbnailHeight, err = processor.GenerateThumbnail(content, mimeType, 200, 200)
		if err != nil {
			g.Log().Warningf(ctx, "生成缩略图失败: %v", err)
			// 缩略图生成失败不影响文件上传
		} else {
			hasThumbnail = true
		}
	}

	// 准备元数据
	metadata := g.Map{
		"original_filename": file.Filename,
		"upload_time":       time.Now().Format("2006-01-02 15:04:05"),
		"content_type":      mimeType,
	}

	// 如果是图片，添加图片信息
	if utility.IsImageFile(mimeType) {
		processor := utility.NewImageProcessor()
		width, height, format, err := processor.GetImageInfo(content)
		if err == nil {
			metadata["image_width"] = width
			metadata["image_height"] = height
			metadata["image_format"] = format
		}
	}

	// 使用原生SQL插入，确保二进制数据正确处理
	insertSQL := `
		INSERT INTO files (
			file_name, file_extension, file_size, mime_type, file_content, 
			file_hash, file_md5, has_thumbnail, thumbnail_content, 
			thumbnail_width, thumbnail_height, metadata, file_status, 
			file_category, uploader_ip, uploader_user_agent, uploader_id, 
			created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
		) RETURNING id`

	result, err := g.DB().GetValue(ctx, insertSQL,
		file.Filename,          // $1 file_name
		extension,              // $2 file_extension
		file.Size,              // $3 file_size
		mimeType,               // $4 mime_type
		content,                // $5 file_content (二进制数据)
		fileHash,               // $6 file_hash
		fileMd5,                // $7 file_md5
		hasThumbnail,           // $8 has_thumbnail
		thumbnailContent,       // $9 thumbnail_content
		thumbnailWidth,         // $10 thumbnail_width
		thumbnailHeight,        // $11 thumbnail_height
		gconv.String(metadata), // $12 metadata
		"active",               // $13 file_status
		category,               // $14 file_category
		uploaderIP,             // $15 uploader_ip
		userAgent,              // $16 uploader_user_agent
		uploaderID,             // $17 uploader_id
		gtime.Now(),            // $18 created_at
		gtime.Now(),            // $19 updated_at
	)
	if err != nil {
		return nil, gerror.Wrap(err, "插入文件记录失败")
	}

	// 转换fileID
	fileID := result.Int64()

	// 查询并返回完整的文件信息
	fileRecord, err := dao.Files.Ctx(ctx).Where("id", fileID).One()
	if err != nil {
		return nil, gerror.Wrap(err, "查询文件记录失败")
	}

	var fileEntity entity.Files
	if err := fileRecord.Struct(&fileEntity); err != nil {
		return nil, gerror.Wrap(err, "解析文件记录失败")
	}

	return &fileEntity, nil
}

// GetFileByUUID 根据UUID获取文件
func (s *sFile) GetFileByUUID(ctx context.Context, fileUUID string) (*entity.Files, error) {
	fileRecord, err := dao.Files.Ctx(ctx).Where("file_uuid", fileUUID).Where("file_status", "active").One()
	if err != nil {
		return nil, gerror.Wrap(err, "查询文件失败")
	}

	if fileRecord.IsEmpty() {
		return nil, gerror.New("文件不存在")
	}

	var fileEntity entity.Files
	if err := fileRecord.Struct(&fileEntity); err != nil {
		return nil, gerror.Wrap(err, "解析文件记录失败")
	}

	return &fileEntity, nil
}

// GetFileByID 根据ID获取文件
func (s *sFile) GetFileByID(ctx context.Context, fileID int64) (*entity.Files, error) {
	fileRecord, err := dao.Files.Ctx(ctx).Where("id", fileID).Where("file_status", "active").One()
	if err != nil {
		return nil, gerror.Wrap(err, "查询文件失败")
	}

	if fileRecord.IsEmpty() {
		return nil, gerror.New("文件不存在")
	}

	var fileEntity entity.Files
	if err := fileRecord.Struct(&fileEntity); err != nil {
		return nil, gerror.Wrap(err, "解析文件记录失败")
	}

	return &fileEntity, nil
}

// GetFileContent 获取文件内容
func (s *sFile) GetFileContent(ctx context.Context, fileUUID string) ([]byte, string, string, error) {
	// 直接从数据库获取文件内容，避免通过entity的字符串转换
	fileRecord, err := dao.Files.Ctx(ctx).
		Fields("file_content, file_name, mime_type").
		Where("file_uuid", fileUUID).
		Where("file_status", "active").
		One()
	if err != nil {
		return nil, "", "", gerror.Wrap(err, "查询文件失败")
	}

	if fileRecord.IsEmpty() {
		return nil, "", "", gerror.New("文件不存在")
	}

	// 直接获取二进制内容
	content := fileRecord["file_content"].Bytes()
	fileName := fileRecord["file_name"].String()
	mimeType := fileRecord["mime_type"].String()

	return content, fileName, mimeType, nil
}

// GetThumbnail 获取缩略图
func (s *sFile) GetThumbnail(ctx context.Context, fileUUID string, width, height int) ([]byte, int, int, error) {
	// 直接从数据库获取缩略图相关数据
	fileRecord, err := dao.Files.Ctx(ctx).
		Fields("has_thumbnail, thumbnail_content, thumbnail_width, thumbnail_height, file_content, mime_type").
		Where("file_uuid", fileUUID).
		Where("file_status", "active").
		One()
	if err != nil {
		return nil, 0, 0, gerror.Wrap(err, "查询文件失败")
	}

	if fileRecord.IsEmpty() {
		return nil, 0, 0, gerror.New("文件不存在")
	}

	// 检查是否有缩略图
	hasThumbnail := fileRecord["has_thumbnail"].Bool()
	if !hasThumbnail {
		return nil, 0, 0, gerror.New("该文件没有缩略图")
	}

	thumbnailWidth := fileRecord["thumbnail_width"].Int()
	thumbnailHeight := fileRecord["thumbnail_height"].Int()

	// 如果请求的尺寸与存储的缩略图尺寸一致，直接返回
	if (width <= 0 || width == thumbnailWidth) &&
		(height <= 0 || height == thumbnailHeight) {
		content := fileRecord["thumbnail_content"].Bytes()
		return content, thumbnailWidth, thumbnailHeight, nil
	}

	// 需要重新生成指定尺寸的缩略图
	originalContent := fileRecord["file_content"].Bytes()
	mimeType := fileRecord["mime_type"].String()
	processor := utility.NewImageProcessor()

	thumbnailContent, actualWidth, actualHeight, err := processor.GenerateThumbnail(
		originalContent, mimeType, width, height)
	if err != nil {
		return nil, 0, 0, gerror.Wrap(err, "生成指定尺寸缩略图失败")
	}

	return thumbnailContent, actualWidth, actualHeight, nil
}

// GetFileList 获取文件列表
func (s *sFile) GetFileList(ctx context.Context, page, pageSize int, category, status, extension string) ([]*entity.Files, int, error) {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100 // 限制最大页面大小
	}

	// 构建查询条件
	query := dao.Files.Ctx(ctx)

	if category != "" {
		query = query.Where("file_category", category)
	}
	if status != "" {
		query = query.Where("file_status", status)
	} else {
		query = query.Where("file_status", "active") // 默认只查询活跃文件
	}
	if extension != "" {
		query = query.Where("file_extension", extension)
	}

	// 查询总数
	total, err := query.Count()
	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询文件总数失败")
	}

	// 查询文件列表（不包含文件内容和缩略图内容）
	offset := (page - 1) * pageSize
	records, err := query.
		Fields("id,file_uuid,file_name,file_extension,file_size,mime_type,file_hash,file_md5,has_thumbnail,thumbnail_width,thumbnail_height,download_count,last_download_at,metadata,file_status,file_category,uploader_ip,uploader_user_agent,uploader_id,created_at,updated_at").
		Order("created_at DESC").
		Limit(offset, pageSize).
		All()
	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询文件列表失败")
	}

	var files []*entity.Files
	if err := records.Structs(&files); err != nil {
		return nil, 0, gerror.Wrap(err, "解析文件列表失败")
	}

	return files, total, nil
}

// DeleteFile 删除文件（软删除）
func (s *sFile) DeleteFile(ctx context.Context, fileUUID string) error {
	// 检查文件是否存在
	_, err := s.GetFileByUUID(ctx, fileUUID)
	if err != nil {
		return err
	}

	// 软删除：更新状态为deleted
	_, err = dao.Files.Ctx(ctx).
		Where("file_uuid", fileUUID).
		Data(g.Map{
			"file_status": "deleted",
			"updated_at":  gtime.Now(),
		}).
		Update()
	if err != nil {
		return gerror.Wrap(err, "删除文件失败")
	}

	return nil
}

// RestoreFile 恢复文件（从软删除状态恢复）
func (s *sFile) RestoreFile(ctx context.Context, fileUUID string) error {
	// 检查文件是否存在且为已删除状态
	var fileInfo *entity.Files
	err := dao.Files.Ctx(ctx).
		Where("file_uuid", fileUUID).
		Where("file_status", "deleted").
		Scan(&fileInfo)
	if err != nil {
		return gerror.Wrap(err, "查询文件失败")
	}
	if fileInfo == nil {
		return gerror.New("文件不存在或未被删除")
	}

	// 恢复文件：更新状态为active
	_, err = dao.Files.Ctx(ctx).
		Where("file_uuid", fileUUID).
		Data(g.Map{
			"file_status": "active",
			"updated_at":  gtime.Now(),
		}).
		Update()
	if err != nil {
		return gerror.Wrap(err, "恢复文件失败")
	}

	return nil
}

// GetFileStats 获取文件统计信息
func (s *sFile) GetFileStats(ctx context.Context) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// 总文件数
	totalFiles, err := dao.Files.Ctx(ctx).Where("file_status", "active").Count()
	if err != nil {
		return nil, gerror.Wrap(err, "查询总文件数失败")
	}
	stats["total_files"] = totalFiles

	// 总文件大小
	var totalSize int64
	result, err := dao.Files.Ctx(ctx).
		Where("file_status", "active").
		Fields("SUM(file_size) as total_size").
		One()
	if err != nil {
		return nil, gerror.Wrap(err, "查询总文件大小失败")
	}
	if !result.IsEmpty() {
		totalSize = result["total_size"].Int64()
	}
	stats["total_size"] = totalSize

	// 按分类统计
	categoryStats, err := dao.Files.Ctx(ctx).
		Where("file_status", "active").
		Fields("file_category, COUNT(*) as count, SUM(file_size) as size").
		Group("file_category").
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询分类统计失败")
	}
	stats["category_stats"] = categoryStats

	// 按扩展名统计
	extensionStats, err := dao.Files.Ctx(ctx).
		Where("file_status", "active").
		Fields("file_extension, COUNT(*) as count, SUM(file_size) as size").
		Group("file_extension").
		Order("count DESC").
		Limit(10).
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询扩展名统计失败")
	}
	stats["extension_stats"] = extensionStats

	// 今日上传统计
	today := time.Now().Format("2006-01-02")
	todayUploads, err := dao.Files.Ctx(ctx).
		Where("file_status", "active").
		Where("DATE(created_at) = ?", today).
		Count()
	if err != nil {
		return nil, gerror.Wrap(err, "查询今日上传统计失败")
	}
	stats["today_uploads"] = todayUploads

	// 总下载次数
	totalDownloadsRes, err := dao.Files.Ctx(ctx).
		Where("file_status", "active").
		Fields("SUM(download_count) as total_downloads").
		One()
	if err != nil {
		return nil, gerror.Wrap(err, "查询总下载次数失败")
	}
	if !totalDownloadsRes.IsEmpty() {
		stats["total_downloads"] = totalDownloadsRes["total_downloads"].Int64()
	} else {
		stats["total_downloads"] = int64(0)
	}

	// 文件大小分布统计（0-1MB, 1-10MB, 10MB+）
	sizeDistRes, err := dao.Files.Ctx(ctx).
		Where("file_status", "active").
		Fields("SUM(CASE WHEN file_size < 1048576 THEN 1 ELSE 0 END) AS count_0_1mb, " +
			"SUM(CASE WHEN file_size >= 1048576 AND file_size < 10485760 THEN 1 ELSE 0 END) AS count_1_10mb, " +
			"SUM(CASE WHEN file_size >= 10485760 THEN 1 ELSE 0 END) AS count_10mb_plus").
		One()
	if err != nil {
		return nil, gerror.Wrap(err, "查询大小分布统计失败")
	}
	if !sizeDistRes.IsEmpty() {
		stats["size_0_1mb"] = sizeDistRes["count_0_1mb"].Int64()
		stats["size_1_10mb"] = sizeDistRes["count_1_10mb"].Int64()
		stats["size_10mb_plus"] = sizeDistRes["count_10mb_plus"].Int64()
	} else {
		stats["size_0_1mb"] = int64(0)
		stats["size_1_10mb"] = int64(0)
		stats["size_10mb_plus"] = int64(0)
	}

	return stats, nil
}

// UpdateDownloadCount 更新下载次数
func (s *sFile) UpdateDownloadCount(ctx context.Context, fileUUID string, downloaderIP string, userAgent string) error {
	// 开启事务
	return dao.Files.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 首先获取文件信息，包括 file_id
		var fileInfo *entity.Files
		err := dao.Files.Ctx(ctx).TX(tx).
			Where("file_uuid", fileUUID).
			Scan(&fileInfo)
		if err != nil {
			return gerror.Wrap(err, "获取文件信息失败")
		}
		if fileInfo == nil {
			return gerror.New("文件不存在")
		}

		// 更新文件下载次数和最后下载时间
		_, err = dao.Files.Ctx(ctx).TX(tx).
			Where("file_uuid", fileUUID).
			Data(g.Map{
				"download_count":   gdb.Raw("download_count + 1"),
				"last_download_at": gtime.Now(),
				"updated_at":       gtime.Now(),
			}).
			Update()
		if err != nil {
			return gerror.Wrap(err, "更新下载次数失败")
		}

		// 记录下载日志，包含 file_id
		_, err = dao.FileDownloadLogs.Ctx(ctx).TX(tx).Data(&do.FileDownloadLogs{
			FileId:            fileInfo.Id, // 添加 file_id 字段
			FileUuid:          fileUUID,
			DownloadIp:        downloaderIP,
			DownloadUserAgent: userAgent,
			DownloadStatus:    "success",
			DownloadTime:      gtime.Now(),
		}).Insert()
		if err != nil {
			return gerror.Wrap(err, "记录下载日志失败")
		}

		return nil
	})
}
