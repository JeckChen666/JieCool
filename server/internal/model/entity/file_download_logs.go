// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// FileDownloadLogs is the golang structure for table file_download_logs.
type FileDownloadLogs struct {
	Id                int64       `json:"id"                orm:"id"                  description:""` //
	FileId            int64       `json:"fileId"            orm:"file_id"             description:""` //
	FileUuid          string      `json:"fileUuid"          orm:"file_uuid"           description:""` //
	DownloadIp        string      `json:"downloadIp"        orm:"download_ip"         description:""` //
	DownloadUserAgent string      `json:"downloadUserAgent" orm:"download_user_agent" description:""` //
	DownloadReferer   string      `json:"downloadReferer"   orm:"download_referer"    description:""` //
	DownloadSize      int64       `json:"downloadSize"      orm:"download_size"       description:""` //
	DownloadStatus    string      `json:"downloadStatus"    orm:"download_status"     description:""` //
	DownloadTime      *gtime.Time `json:"downloadTime"      orm:"download_time"       description:""` //
}
