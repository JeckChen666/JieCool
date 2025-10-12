// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// WeiboPosts is the golang structure of table weibo_posts for DAO operations like Where/Data.
type WeiboPosts struct {
	g.Meta     `orm:"table:weibo_posts, do:true"`
	Id         any         //
	Content    any         //
	CreatedAt  *gtime.Time //
	UpdatedAt  *gtime.Time //
	AuthorId   any         //
	Visibility any         // public: 公开，private: 登录可见（权限预留）
	Lat        any         //
	Lng        any         //
	City       any         //
	Device     any         //
	Ip         any         //
	IsDeleted  any         //
	Extra      any         //
}
