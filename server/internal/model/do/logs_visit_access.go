// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package do

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
)

// LogsVisitAccess is the golang structure of table logs_visit_access for DAO operations like Where/Data.
type LogsVisitAccess struct {
	g.Meta    `orm:"table:logs_visit_access, do:true"`
	Id        any         //
	Time      *gtime.Time //
	Ip        any         //
	UserAgent any         //
	Method    any         //
	Path      any         //
	Headers   any         //
	CreatedAt *gtime.Time //
}
