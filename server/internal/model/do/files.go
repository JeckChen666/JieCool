// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// Files is the golang structure of table files for DAO operations like Where/Data.
type Files struct {
	g.Meta            `orm:"table:files, do:true"`
	Id                any         //
	FileUuid          any         //
	FileName          any         //
	FileExtension     any         //
	FileSize          any         //
	MimeType          any         //
	FileContent       any         //
	FileHash          any         //
	HasThumbnail      any         //
	ThumbnailContent  any         //
	ThumbnailWidth    any         //
	ThumbnailHeight   any         //
	DownloadCount     any         //
	LastDownloadAt    *gtime.Time //
	Metadata          any         //
	FileStatus        any         //
	FileCategory      any         //
	UploaderIp        any         //
	UploaderUserAgent any         //
	UploaderId        any         //
	CreatedAt         *gtime.Time //
	UpdatedAt         *gtime.Time //
	FileMd5           any         //
	ApplicationName   any         //
	FileContentId     any         // 关联文件内容表ID
}
