// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogArticleTags is the golang structure of table blog_article_tags for DAO operations like Where/Data.
type BlogArticleTags struct {
	g.Meta    `orm:"table:blog_article_tags, do:true"`
	Id        any         //
	ArticleId any         //
	TagId     any         //
	CreatedAt *gtime.Time //
}
