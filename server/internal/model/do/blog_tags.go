// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogTags is the golang structure of table blog_tags for DAO operations like Where/Data.
type BlogTags struct {
	g.Meta       `orm:"table:blog_tags, do:true"`
	Id           any         //
	TagId        any         //
	Name         any         //
	Slug         any         //
	Description  any         //
	Color        any         //
	ArticleCount any         //
	IsActive     any         //
	CreatedAt    *gtime.Time //
	UpdatedAt    *gtime.Time //
}
