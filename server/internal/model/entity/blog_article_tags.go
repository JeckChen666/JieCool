// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogArticleTags is the golang structure for table blog_article_tags.
type BlogArticleTags struct {
	Id        int64       `json:"id"        orm:"id"         description:""` //
	ArticleId int64       `json:"articleId" orm:"article_id" description:""` //
	TagId     int64       `json:"tagId"     orm:"tag_id"     description:""` //
	CreatedAt *gtime.Time `json:"createdAt" orm:"created_at" description:""` //
}
