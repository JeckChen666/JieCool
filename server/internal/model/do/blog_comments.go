// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogComments is the golang structure of table blog_comments for DAO operations like Where/Data.
type BlogComments struct {
	g.Meta         `orm:"table:blog_comments, do:true"`
	Id             any         //
	CommentId      any         //
	ArticleId      any         //
	ParentId       any         //
	VisitorName    any         //
	VisitorEmail   any         //
	VisitorWebsite any         //
	Content        any         //
	HtmlContent    any         //
	Status         any         //
	IsDeleted      any         //
	CreatedAt      *gtime.Time //
	UpdatedAt      *gtime.Time //
}
