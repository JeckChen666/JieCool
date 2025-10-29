// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogComments is the golang structure for table blog_comments.
type BlogComments struct {
	Id             int64       `json:"id"             orm:"id"              description:""` //
	CommentId      string      `json:"commentId"      orm:"comment_id"      description:""` //
	ArticleId      int64       `json:"articleId"      orm:"article_id"      description:""` //
	ParentId       int64       `json:"parentId"       orm:"parent_id"       description:""` //
	VisitorName    string      `json:"visitorName"    orm:"visitor_name"    description:""` //
	VisitorEmail   string      `json:"visitorEmail"   orm:"visitor_email"   description:""` //
	VisitorWebsite string      `json:"visitorWebsite" orm:"visitor_website" description:""` //
	Content        string      `json:"content"        orm:"content"         description:""` //
	HtmlContent    string      `json:"htmlContent"    orm:"html_content"    description:""` //
	Status         string      `json:"status"         orm:"status"          description:""` //
	IsDeleted      bool        `json:"isDeleted"      orm:"is_deleted"      description:""` //
	CreatedAt      *gtime.Time `json:"createdAt"      orm:"created_at"      description:""` //
	UpdatedAt      *gtime.Time `json:"updatedAt"      orm:"updated_at"      description:""` //
}
