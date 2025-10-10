// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package entity

import (
	"github.com/gogf/gf/v2/os/gtime"
)

// DynamicConfigVersions is the golang structure for table dynamic_config_versions.
type DynamicConfigVersions struct {
	Id           int64       `json:"id"           orm:"id"            description:""` //
	Namespace    string      `json:"namespace"    orm:"namespace"     description:""` //
	Env          string      `json:"env"          orm:"env"           description:""` //
	Key          string      `json:"key"          orm:"key"           description:""` //
	Version      int         `json:"version"      orm:"version"       description:""` //
	Type         string      `json:"type"         orm:"type"          description:""` //
	Value        string      `json:"value"        orm:"value"         description:""` //
	Enabled      bool        `json:"enabled"      orm:"enabled"       description:""` //
	Description  string      `json:"description"  orm:"description"   description:""` //
	ChangedBy    string      `json:"changedBy"    orm:"changed_by"    description:""` //
	ChangeReason string      `json:"changeReason" orm:"change_reason" description:""` //
	CreatedAt    *gtime.Time `json:"createdAt"    orm:"created_at"    description:""` //
}
