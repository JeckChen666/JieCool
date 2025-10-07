// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// LogsVisitAccess is the golang structure for table logs_visit_access.
type LogsVisitAccess struct {
	Id        int64       `json:"id"        orm:"id"         description:""` //
	Time      *gtime.Time `json:"time"      orm:"time"       description:""` //
	Ip        string      `json:"ip"        orm:"ip"         description:""` //
	UserAgent string      `json:"userAgent" orm:"user_agent" description:""` //
	Method    string      `json:"method"    orm:"method"     description:""` //
	Path      string      `json:"path"      orm:"path"       description:""` //
	Headers   string      `json:"headers"   orm:"headers"    description:""` //
	CreatedAt *gtime.Time `json:"createdAt" orm:"created_at" description:""` //
}
