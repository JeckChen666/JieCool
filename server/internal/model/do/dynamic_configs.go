// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// DynamicConfigs is the golang structure of table dynamic_configs for DAO operations like Where/Data.
type DynamicConfigs struct {
	g.Meta      `orm:"table:dynamic_configs, do:true"`
	Id          any         //
	Namespace   any         //
	Env         any         //
	Key         any         //
	Type        any         //
	Value       any         //
	Enabled     any         //
	Version     any         //
	Description any         //
	UpdatedBy   any         //
	UpdatedAt   *gtime.Time //
}
