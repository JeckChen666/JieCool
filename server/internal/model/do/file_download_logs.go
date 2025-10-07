// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// FileDownloadLogs is the golang structure of table file_download_logs for DAO operations like Where/Data.
type FileDownloadLogs struct {
	g.Meta            `orm:"table:file_download_logs, do:true"`
	Id                any         //
	FileId            any         //
	FileUuid          any         //
	DownloadIp        any         //
	DownloadUserAgent any         //
	DownloadReferer   any         //
	DownloadSize      any         //
	DownloadStatus    any         //
	DownloadTime      *gtime.Time //
}
