// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// FileContents is the golang structure of table file_contents for DAO operations like Where/Data.
type FileContents struct {
	g.Meta           `orm:"table:file_contents, do:true"`
	Id               any         // 主键ID
	FileContent      any         // 文件二进制内容
	ThumbnailContent any         // 缩略图二进制内容
	CreatedAt        *gtime.Time // 创建时间
	UpdatedAt        *gtime.Time // 更新时间
}
