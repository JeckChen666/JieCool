// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// WeiboSnapshots is the golang structure for table weibo_snapshots.
type WeiboSnapshots struct {
	Id                 int64       `json:"id"                 orm:"id"                  description:""` //
	PostId             int64       `json:"postId"             orm:"post_id"             description:""` //
	Version            int         `json:"version"            orm:"version"             description:""` //
	SnapshotContent    string      `json:"snapshotContent"    orm:"snapshot_content"    description:""` //
	SnapshotVisibility string      `json:"snapshotVisibility" orm:"snapshot_visibility" description:""` //
	SnapshotMeta       string      `json:"snapshotMeta"       orm:"snapshot_meta"       description:""` //
	CreatedAt          *gtime.Time `json:"createdAt"          orm:"created_at"          description:""` //
}
