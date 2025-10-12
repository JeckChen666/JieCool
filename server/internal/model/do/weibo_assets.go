// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// WeiboAssets is the golang structure of table weibo_assets for DAO operations like Where/Data.
type WeiboAssets struct {
	g.Meta    `orm:"table:weibo_assets, do:true"`
	Id        any         //
	PostId    any         //
	FileId    any         // 引用文件系统中的文件主键/唯一ID（暂不设置外键，后续确认后可补充）
	Kind      any         //
	SortOrder any         //
	CreatedAt *gtime.Time //
}
