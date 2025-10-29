// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogArticles is the golang structure of table blog_articles for DAO operations like Where/Data.
type BlogArticles struct {
	g.Meta        `orm:"table:blog_articles, do:true"`
	Id            any         //
	ArticleId     any         //
	Title         any         //
	Slug          any         //
	Summary       any         //
	Content       any         //
	HtmlContent   any         //
	AuthorId      any         //
	CategoryId    any         //
	Status        any         //
	IsDraft       any         //
	IsTop         any         //
	IsPrivate     any         //
	ViewCount     any         //
	LikeCount     any         //
	CommentCount  any         //
	ShareCount    any         //
	FeaturedImage any         //
	ReadTime      any         //
	PublishAt     *gtime.Time //
	CreatedAt     *gtime.Time //
	UpdatedAt     *gtime.Time //
	DeletedAt     *gtime.Time //
}
