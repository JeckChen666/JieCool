// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// BlogCategories is the golang structure for table blog_categories.
type BlogCategories struct {
	Id           int64       `json:"id"           orm:"id"            description:""` //
	CategoryId   string      `json:"categoryId"   orm:"category_id"   description:""` //
	Name         string      `json:"name"         orm:"name"          description:""` //
	Slug         string      `json:"slug"         orm:"slug"          description:""` //
	Description  string      `json:"description"  orm:"description"   description:""` //
	ParentId     int64       `json:"parentId"     orm:"parent_id"     description:""` //
	SortOrder    int         `json:"sortOrder"    orm:"sort_order"    description:""` //
	ArticleCount int         `json:"articleCount" orm:"article_count" description:""` //
	IsActive     bool        `json:"isActive"     orm:"is_active"     description:""` //
	CreatedAt    *gtime.Time `json:"createdAt"    orm:"created_at"    description:""` //
	UpdatedAt    *gtime.Time `json:"updatedAt"    orm:"updated_at"    description:""` //
}
