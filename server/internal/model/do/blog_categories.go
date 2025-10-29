// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogCategories is the golang structure of table blog_categories for DAO operations like Where/Data.
type BlogCategories struct {
	g.Meta       `orm:"table:blog_categories, do:true"`
	Id           any         //
	CategoryId   any         //
	Name         any         //
	Slug         any         //
	Description  any         //
	ParentId     any         //
	SortOrder    any         //
	ArticleCount any         //
	IsActive     any         //
	CreatedAt    *gtime.Time //
	UpdatedAt    *gtime.Time //
}
