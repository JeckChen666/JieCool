// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// WeiboSnapshots is the golang structure of table weibo_snapshots for DAO operations like Where/Data.
type WeiboSnapshots struct {
	g.Meta             `orm:"table:weibo_snapshots, do:true"`
	Id                 any         //
	PostId             any         //
	Version            any         //
	SnapshotContent    any         //
	SnapshotVisibility any         //
	SnapshotMeta       any         //
	CreatedAt          *gtime.Time //
}
