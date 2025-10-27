// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// Files is the golang structure for table files.
type Files struct {
	Id                int64       `json:"id"                orm:"id"                  description:""`          //
	FileUuid          string      `json:"fileUuid"          orm:"file_uuid"           description:""`          //
	FileName          string      `json:"fileName"          orm:"file_name"           description:""`          //
	FileExtension     string      `json:"fileExtension"     orm:"file_extension"      description:""`          //
	FileSize          int64       `json:"fileSize"          orm:"file_size"           description:""`          //
	MimeType          string      `json:"mimeType"          orm:"mime_type"           description:""`          //
	FileContent       string      `json:"fileContent"       orm:"file_content"        description:""`          //
	FileHash          string      `json:"fileHash"          orm:"file_hash"           description:""`          //
	HasThumbnail      bool        `json:"hasThumbnail"      orm:"has_thumbnail"       description:""`          //
	ThumbnailContent  string      `json:"thumbnailContent"  orm:"thumbnail_content"   description:""`          //
	ThumbnailWidth    int         `json:"thumbnailWidth"    orm:"thumbnail_width"     description:""`          //
	ThumbnailHeight   int         `json:"thumbnailHeight"   orm:"thumbnail_height"    description:""`          //
	DownloadCount     int64       `json:"downloadCount"     orm:"download_count"      description:""`          //
	LastDownloadAt    *gtime.Time `json:"lastDownloadAt"    orm:"last_download_at"    description:""`          //
	Metadata          string      `json:"metadata"          orm:"metadata"            description:""`          //
	FileStatus        string      `json:"fileStatus"        orm:"file_status"         description:""`          //
	FileCategory      string      `json:"fileCategory"      orm:"file_category"       description:""`          //
	UploaderIp        string      `json:"uploaderIp"        orm:"uploader_ip"         description:""`          //
	UploaderUserAgent string      `json:"uploaderUserAgent" orm:"uploader_user_agent" description:""`          //
	UploaderId        int64       `json:"uploaderId"        orm:"uploader_id"         description:""`          //
	CreatedAt         *gtime.Time `json:"createdAt"         orm:"created_at"          description:""`          //
	UpdatedAt         *gtime.Time `json:"updatedAt"         orm:"updated_at"          description:""`          //
	FileMd5           string      `json:"fileMd5"           orm:"file_md5"            description:""`          //
	ApplicationName   string      `json:"applicationName"   orm:"application_name"    description:""`          //
	FileContentId     int64       `json:"fileContentId"     orm:"file_content_id"     description:"关联文件内容表ID"` // 关联文件内容表ID
}
