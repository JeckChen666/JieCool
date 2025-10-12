package v1

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
)

// UploadFileReq 文件上传请求结构
type UploadFileReq struct {
	g.Meta   `path:"/file/upload" tags:"File" method:"post" summary:"Upload file to database"`
	File     *ghttp.UploadFile `json:"file" v:"required#请选择要上传的文件" dc:"上传的文件"`
	Category string            `json:"category" dc:"文件分类（可选）"`
}

// UploadFileRes 文件上传响应结构
type UploadFileRes struct {
	FileUuid      string `json:"file_uuid" dc:"文件唯一标识符"`
	FileName      string `json:"file_name" dc:"文件名"`
	FileSize      int64  `json:"file_size" dc:"文件大小（字节）"`
	FileExtension string `json:"file_extension" dc:"文件扩展名"`
	MimeType      string `json:"mime_type" dc:"MIME类型"`
	FileMd5       string `json:"file_md5" dc:"文件MD5哈希值，用于完整性校验"`
	HasThumbnail  bool   `json:"has_thumbnail" dc:"是否有缩略图"`
	DownloadUrl   string `json:"download_url" dc:"下载链接"`
	ThumbnailUrl  string `json:"thumbnail_url,omitempty" dc:"缩略图链接"`
}

// DownloadFileReq 文件下载请求结构
type DownloadFileReq struct {
	g.Meta   `path:"/file/download/{file_uuid}" tags:"File" method:"get" summary:"Download file by UUID"`
	FileUuid string `json:"file_uuid" v:"required#文件UUID不能为空" dc:"文件唯一标识符"`
}

// DownloadFileRes 文件下载响应结构（直接返回文件流，不使用JSON）
type DownloadFileRes struct {
	// 这个结构体主要用于文档生成，实际响应是文件流
}

// GetThumbnailReq 获取缩略图请求结构
type GetThumbnailReq struct {
	g.Meta   `path:"/file/thumbnail/{file_uuid}" tags:"File" method:"get" summary:"Get file thumbnail by UUID"`
	FileUuid string `json:"file_uuid" v:"required#文件UUID不能为空" dc:"文件唯一标识符"`
	Width    int    `json:"width" d:"200" dc:"缩略图宽度（可选，默认200）"`
	Height   int    `json:"height" d:"200" dc:"缩略图高度（可选，默认200）"`
}

// GetThumbnailRes 获取缩略图响应结构（直接返回图片流，不使用JSON）
type GetThumbnailRes struct {
	// 这个结构体主要用于文档生成，实际响应是图片流
}

// GetFileInfoReq 获取文件信息请求结构
type GetFileInfoReq struct {
	g.Meta   `path:"/file/info/{file_uuid}" tags:"File" method:"get" summary:"Get file information by UUID"`
	FileUuid string `json:"file_uuid" v:"required#文件UUID不能为空" dc:"文件唯一标识符"`
}

// GetFileInfoByIDReq 根据文件ID获取文件信息请求结构
type GetFileInfoByIDReq struct {
	g.Meta `path:"/file/info/by-id/{id}" tags:"File" method:"get" summary:"Get file information by ID"`
	Id     int64 `json:"id" v:"required|min:1#文件ID无效" dc:"文件ID（files.id）"`
}

// GetFileInfoRes 获取文件信息响应结构
type GetFileInfoRes struct {
	Id              int64       `json:"id" dc:"文件ID"`
	FileUuid        string      `json:"file_uuid" dc:"文件唯一标识符"`
	FileName        string      `json:"file_name" dc:"文件名"`
	FileExtension   string      `json:"file_extension" dc:"文件扩展名"`
	FileSize        int64       `json:"file_size" dc:"文件大小（字节）"`
	MimeType        string      `json:"mime_type" dc:"MIME类型"`
	FileCategory    string      `json:"file_category" dc:"文件分类"`
	FileHash        string      `json:"file_hash" dc:"文件哈希值"`
	FileMd5         string      `json:"file_md5" dc:"文件MD5哈希值"`
	HasThumbnail    bool        `json:"has_thumbnail" dc:"是否有缩略图"`
	ThumbnailWidth  int         `json:"thumbnail_width,omitempty" dc:"缩略图宽度"`
	ThumbnailHeight int         `json:"thumbnail_height,omitempty" dc:"缩略图高度"`
	DownloadCount   int64       `json:"download_count" dc:"下载次数"`
	LastDownloadAt  string      `json:"last_download_at,omitempty" dc:"最近一次下载时间"`
	Metadata        interface{} `json:"metadata,omitempty" dc:"文件元数据"`
	FileStatus      string      `json:"file_status" dc:"文件状态"`
	CreatedAt       string      `json:"created_at" dc:"创建时间"`
	UpdatedAt       string      `json:"updated_at" dc:"更新时间"`
	DownloadUrl     string      `json:"download_url" dc:"下载链接"`
	ThumbnailUrl    string      `json:"thumbnail_url,omitempty" dc:"缩略图链接"`
}

// GetFileListReq 获取文件列表请求结构
type GetFileListReq struct {
	g.Meta       `path:"/file/list" tags:"File" method:"get" summary:"Get file list with pagination and filters"`
	Page         int    `json:"page" d:"1" dc:"页码（从1开始）"`
	PageSize     int    `json:"page_size" d:"20" dc:"每页数量（最大100）"`
	Category     string `json:"category" dc:"文件分类筛选"`
	Extension    string `json:"extension" dc:"文件扩展名筛选"`
	Keyword      string `json:"keyword" dc:"文件名关键词搜索"`
	SortBy       string `json:"sort_by" d:"created_at" dc:"排序字段（created_at, file_size, download_count）"`
	SortOrder    string `json:"sort_order" d:"desc" dc:"排序方向（asc, desc）"`
	DateFrom     string `json:"date_from" dc:"创建时间筛选开始日期（YYYY-MM-DD）"`
	DateTo       string `json:"date_to" dc:"创建时间筛选结束日期（YYYY-MM-DD）"`
	MinSize      int64  `json:"min_size" dc:"最小文件大小（字节）"`
	MaxSize      int64  `json:"max_size" dc:"最大文件大小（字节）"`
	HasThumbnail *bool  `json:"has_thumbnail" dc:"是否有缩略图筛选"`
}

// FileListItem 文件列表项结构
type FileListItem struct {
	Id             int64  `json:"id" dc:"文件ID"`
	FileUuid       string `json:"file_uuid" dc:"文件唯一标识符"`
	FileName       string `json:"file_name" dc:"文件名"`
	FileExtension  string `json:"file_extension" dc:"文件扩展名"`
	FileSize       int64  `json:"file_size" dc:"文件大小（字节）"`
	MimeType       string `json:"mime_type" dc:"MIME类型"`
	FileMd5        string `json:"file_md5" dc:"文件MD5哈希值"`
	FileCategory   string `json:"file_category" dc:"文件分类"`
	HasThumbnail   bool   `json:"has_thumbnail" dc:"是否有缩略图"`
	DownloadCount  int64  `json:"download_count" dc:"下载次数"`
	LastDownloadAt string `json:"last_download_at,omitempty" dc:"最近一次下载时间"`
	CreatedAt      string `json:"created_at" dc:"创建时间"`
	DownloadUrl    string `json:"download_url" dc:"下载链接"`
	ThumbnailUrl   string `json:"thumbnail_url,omitempty" dc:"缩略图链接"`
}

// GetFileListRes 获取文件列表响应结构
type GetFileListRes struct {
	List       []FileListItem `json:"list" dc:"文件列表"`
	Total      int64          `json:"total" dc:"总数量"`
	Page       int            `json:"page" dc:"当前页码"`
	PageSize   int            `json:"page_size" dc:"每页数量"`
	TotalPages int            `json:"total_pages" dc:"总页数"`
}

// DeleteFileReq 删除文件请求结构
type DeleteFileReq struct {
	g.Meta   `path:"/file/delete/{file_uuid}" tags:"File" method:"delete" summary:"Delete file by UUID"`
	FileUuid string `json:"file_uuid" v:"required#文件UUID不能为空" dc:"文件唯一标识符"`
}

// DeleteFileRes 删除文件响应结构
type DeleteFileRes struct {
	Success bool   `json:"success" dc:"是否删除成功"`
	Message string `json:"message" dc:"删除结果消息"`
}

// RestoreFileReq 恢复文件请求结构
type RestoreFileReq struct {
	g.Meta   `path:"/file/restore/{file_uuid}" tags:"File" method:"post" summary:"Restore deleted file by UUID"`
	FileUuid string `json:"file_uuid" v:"required#文件UUID不能为空" dc:"文件唯一标识符"`
}

// RestoreFileRes 恢复文件响应结构
type RestoreFileRes struct {
	Success bool   `json:"success" dc:"是否恢复成功"`
	Message string `json:"message" dc:"恢复结果消息"`
}

// GetFileStatsReq 获取文件统计请求结构
type GetFileStatsReq struct {
	g.Meta `path:"/file/stats" tags:"File" method:"get" summary:"Get file statistics"`
}

// CategoryStats 分类统计结构
type CategoryStats struct {
	Category string `json:"category" dc:"分类名称"`
	Count    int64  `json:"count" dc:"文件数量"`
	Size     int64  `json:"size" dc:"总大小"`
}

// ExtensionStats 扩展名统计结构
type ExtensionStats struct {
	Extension string `json:"extension" dc:"扩展名"`
	Count     int64  `json:"count" dc:"文件数量"`
	Size      int64  `json:"size" dc:"总大小"`
}

// SizeDistribution 大小分布统计结构
type SizeDistribution struct {
	Range string `json:"range" dc:"大小范围"`
	Count int64  `json:"count" dc:"文件数量"`
}

// FileStats 文件统计结构
type FileStats struct {
	TotalFiles       int64              `json:"total_files" dc:"总文件数"`
	TotalSize        int64              `json:"total_size" dc:"总文件大小（字节）"`
	TotalDownloads   int64              `json:"total_downloads" dc:"总下载次数"`
	CategoryStats    []CategoryStats    `json:"category_stats" dc:"分类统计"`
	ExtensionStats   []ExtensionStats   `json:"extension_stats" dc:"扩展名统计"`
	SizeDistribution []SizeDistribution `json:"size_distribution" dc:"大小分布统计"`
}

// GetFileStatsRes 获取文件统计响应结构
type GetFileStatsRes struct {
	FileStats
}

// GetFileMd5Req 获取文件MD5请求结构
type GetFileMd5Req struct {
	g.Meta   `path:"/file/md5/{file_uuid}" tags:"File" method:"get" summary:"Get file MD5 hash by UUID"`
	FileUuid string `json:"file_uuid" v:"required#文件UUID不能为空" dc:"文件唯一标识符"`
}

// GetFileMd5Res 获取文件MD5响应结构
type GetFileMd5Res struct {
	FileUuid string `json:"file_uuid" dc:"文件唯一标识符"`
	FileName string `json:"file_name" dc:"文件名"`
	FileMd5  string `json:"file_md5" dc:"文件MD5哈希值"`
	FileSize int64  `json:"file_size" dc:"文件大小（字节）"`
}
