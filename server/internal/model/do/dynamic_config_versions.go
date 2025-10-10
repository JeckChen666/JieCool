// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// DynamicConfigVersions is the golang structure of table dynamic_config_versions for DAO operations like Where/Data.
type DynamicConfigVersions struct {
	g.Meta       `orm:"table:dynamic_config_versions, do:true"`
	Id           any         //
	Namespace    any         //
	Env          any         //
	Key          any         //
	Version      any         //
	Type         any         //
	Value        any         //
	Enabled      any         //
	Description  any         //
	ChangedBy    any         //
	ChangeReason any         //
	CreatedAt    *gtime.Time //
}
