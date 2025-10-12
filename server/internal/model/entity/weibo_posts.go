// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// WeiboPosts is the golang structure for table weibo_posts.
type WeiboPosts struct {
	Id         int64       `json:"id"         orm:"id"         description:""`                               //
	Content    string      `json:"content"    orm:"content"    description:""`                               //
	CreatedAt  *gtime.Time `json:"createdAt"  orm:"created_at" description:""`                               //
	UpdatedAt  *gtime.Time `json:"updatedAt"  orm:"updated_at" description:""`                               //
	AuthorId   int64       `json:"authorId"   orm:"author_id"  description:""`                               //
	Visibility string      `json:"visibility" orm:"visibility" description:"public: 公开，private: 登录可见（权限预留）"` // public: 公开，private: 登录可见（权限预留）
	Lat        float64     `json:"lat"        orm:"lat"        description:""`                               //
	Lng        float64     `json:"lng"        orm:"lng"        description:""`                               //
	City       string      `json:"city"       orm:"city"       description:""`                               //
	Device     string      `json:"device"     orm:"device"     description:""`                               //
	Ip         string      `json:"ip"         orm:"ip"         description:""`                               //
	IsDeleted  bool        `json:"isDeleted"  orm:"is_deleted" description:""`                               //
	Extra      string      `json:"extra"      orm:"extra"      description:""`                               //
}
