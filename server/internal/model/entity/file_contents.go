// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// FileContents is the golang structure for table file_contents.
type FileContents struct {
	Id               int64       `json:"id"               orm:"id"                description:"主键ID"`     // 主键ID
	FileContent      string      `json:"fileContent"      orm:"file_content"      description:"文件二进制内容"`  // 文件二进制内容
	ThumbnailContent string      `json:"thumbnailContent" orm:"thumbnail_content" description:"缩略图二进制内容"` // 缩略图二进制内容
	CreatedAt        *gtime.Time `json:"createdAt"        orm:"created_at"        description:"创建时间"`     // 创建时间
	UpdatedAt        *gtime.Time `json:"updatedAt"        orm:"updated_at"        description:"更新时间"`     // 更新时间
}
