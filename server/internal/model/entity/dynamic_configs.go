// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// DynamicConfigs is the golang structure for table dynamic_configs.
type DynamicConfigs struct {
	Id          int64       `json:"id"          orm:"id"          description:""` //
	Namespace   string      `json:"namespace"   orm:"namespace"   description:""` //
	Env         string      `json:"env"         orm:"env"         description:""` //
	Key         string      `json:"key"         orm:"key"         description:""` //
	Type        string      `json:"type"        orm:"type"        description:""` //
	Value       string      `json:"value"       orm:"value"       description:""` //
	Enabled     bool        `json:"enabled"     orm:"enabled"     description:""` //
	Version     int         `json:"version"     orm:"version"     description:""` //
	Description string      `json:"description" orm:"description" description:""` //
	UpdatedBy   string      `json:"updatedBy"   orm:"updated_by"  description:""` //
	UpdatedAt   *gtime.Time `json:"updatedAt"   orm:"updated_at"  description:""` //
}
