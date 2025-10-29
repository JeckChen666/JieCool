// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogArticles is the golang structure for table blog_articles.
type BlogArticles struct {
	Id            int64       `json:"id"            orm:"id"             description:""` //
	ArticleId     string      `json:"articleId"     orm:"article_id"     description:""` //
	Title         string      `json:"title"         orm:"title"          description:""` //
	Slug          string      `json:"slug"          orm:"slug"           description:""` //
	Summary       string      `json:"summary"       orm:"summary"        description:""` //
	Content       string      `json:"content"       orm:"content"        description:""` //
	HtmlContent   string      `json:"htmlContent"   orm:"html_content"   description:""` //
	AuthorId      int64       `json:"authorId"      orm:"author_id"      description:""` //
	CategoryId    int64       `json:"categoryId"    orm:"category_id"    description:""` //
	Status        string      `json:"status"        orm:"status"         description:""` //
	IsDraft       bool        `json:"isDraft"       orm:"is_draft"       description:""` //
	IsTop         bool        `json:"isTop"         orm:"is_top"         description:""` //
	IsPrivate     bool        `json:"isPrivate"     orm:"is_private"     description:""` //
	ViewCount     int         `json:"viewCount"     orm:"view_count"     description:""` //
	LikeCount     int         `json:"likeCount"     orm:"like_count"     description:""` //
	CommentCount  int         `json:"commentCount"  orm:"comment_count"  description:""` //
	ShareCount    int         `json:"shareCount"    orm:"share_count"    description:""` //
	FeaturedImage string      `json:"featuredImage" orm:"featured_image" description:""` //
	ReadTime      int         `json:"readTime"      orm:"read_time"      description:""` //
	PublishAt     *gtime.Time `json:"publishAt"     orm:"publish_at"     description:""` //
	CreatedAt     *gtime.Time `json:"createdAt"     orm:"created_at"     description:""` //
	UpdatedAt     *gtime.Time `json:"updatedAt"     orm:"updated_at"     description:""` //
	DeletedAt     *gtime.Time `json:"deletedAt"     orm:"deleted_at"     description:""` //
}
