// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// WeiboAssets is the golang structure for table weibo_assets.
type WeiboAssets struct {
	Id        int64       `json:"id"        orm:"id"         description:""`                                   //
	PostId    int64       `json:"postId"    orm:"post_id"    description:""`                                   //
	FileId    int64       `json:"fileId"    orm:"file_id"    description:"引用文件系统中的文件主键/唯一ID（暂不设置外键，后续确认后可补充）"` // 引用文件系统中的文件主键/唯一ID（暂不设置外键，后续确认后可补充）
	Kind      string      `json:"kind"      orm:"kind"       description:""`                                   //
	SortOrder int         `json:"sortOrder" orm:"sort_order" description:""`                                   //
	CreatedAt *gtime.Time `json:"createdAt" orm:"created_at" description:""`                                   //
}
