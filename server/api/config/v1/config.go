package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// 列表查询
type ListReq struct {
	g.Meta    `path:"/config/list" tags:"Config" method:"get" summary:"List dynamic configs with filters"`
	Namespace string `json:"namespace" dc:"命名空间，可选"`
	Env       string `json:"env" dc:"环境，可选"`
	KeyLike   string `json:"key_like" dc:"Key 模糊查询，可选"`
	Enabled   *bool  `json:"enabled" dc:"启用状态，可选"`
	Page      int    `json:"page" d:"1"`
	Size      int    `json:"size" d:"20"`
}

type ConfigItem struct {
	Namespace   string      `json:"namespace"`
	Env         string      `json:"env"`
	Key         string      `json:"key"`
	Type        string      `json:"type"`
	Value       interface{} `json:"value"`
	Enabled     bool        `json:"enabled"`
	Version     int         `json:"version"`
	Description string      `json:"description"`
	UpdatedBy   string      `json:"updated_by"`
	UpdatedAt   string      `json:"updated_at"`
}

type ListRes struct {
	Items []ConfigItem `json:"items"`
	Total int          `json:"total"`
}

// 单项查询
type ItemReq struct {
	g.Meta    `path:"/config/item" tags:"Config" method:"get" summary:"Get config item by unique key"`
	Namespace string `json:"namespace" v:"required"`
	Env       string `json:"env" v:"required"`
	Key       string `json:"key" v:"required"`
}

type ItemRes struct {
	Item *ConfigItem `json:"item"`
}

// 创建
type CreateReq struct {
	g.Meta       `path:"/config/create" tags:"Config" method:"post" summary:"Create a dynamic config"`
	Namespace    string      `json:"namespace" v:"required"`
	Env          string      `json:"env" v:"required"`
	Key          string      `json:"key" v:"required"`
	Type         string      `json:"type" v:"required|in:string,json,number,bool"`
	Value        interface{} `json:"value" v:"required"`
	Enabled      bool        `json:"enabled"`
	Description  string      `json:"description"`
	ChangeReason string      `json:"change_reason" v:"required"`
}

type CreateRes struct {
	Ok bool `json:"ok"`
}

// 更新
type UpdateReq struct {
	g.Meta       `path:"/config/update" tags:"Config" method:"put" summary:"Update a dynamic config"`
	Namespace    string      `json:"namespace" v:"required"`
	Env          string      `json:"env" v:"required"`
	Key          string      `json:"key" v:"required"`
	Type         string      `json:"type" v:"required|in:string,json,number,bool"`
	Value        interface{} `json:"value" v:"required"`
	Enabled      bool        `json:"enabled"`
	Description  string      `json:"description"`
	Version      int         `json:"version" v:"required|min:1"`
	ChangeReason string      `json:"change_reason" v:"required"`
}

type UpdateRes struct {
	Ok bool `json:"ok"`
}

// 删除
type DeleteReq struct {
	g.Meta       `path:"/config/delete" tags:"Config" method:"delete" summary:"Delete a dynamic config"`
	Namespace    string `json:"namespace" v:"required"`
	Env          string `json:"env" v:"required"`
	Key          string `json:"key" v:"required"`
	Version      int    `json:"version" v:"required|min:1"`
	ChangeReason string `json:"change_reason" v:"required"`
}

type DeleteRes struct {
	Ok bool `json:"ok"`
}

// 历史版本
type VersionsReq struct {
	g.Meta    `path:"/config/versions" tags:"Config" method:"get" summary:"List versions of a config item"`
	Namespace string `json:"namespace" v:"required"`
	Env       string `json:"env" v:"required"`
	Key       string `json:"key" v:"required"`
	Page      int    `json:"page" d:"1"`
	Size      int    `json:"size" d:"20"`
}

type VersionItem struct {
	Version      int         `json:"version"`
	Value        interface{} `json:"value"`
	ChangedBy    string      `json:"changed_by"`
	ChangeReason string      `json:"change_reason"`
	CreatedAt    string      `json:"created_at"`
}

type VersionsRes struct {
	Items []VersionItem `json:"items"`
	Total int           `json:"total"`
}

// 回滚
type RollbackReq struct {
	g.Meta       `path:"/config/rollback" tags:"Config" method:"post" summary:"Rollback a config item to specific version"`
	Namespace    string `json:"namespace" v:"required"`
	Env          string `json:"env" v:"required"`
	Key          string `json:"key" v:"required"`
	ToVersion    int    `json:"to_version" v:"required|min:1"`
	ChangeReason string `json:"change_reason" v:"required"`
}

type RollbackRes struct {
	Ok bool `json:"ok"`
}

// 导入/导出
type ImportReq struct {
	g.Meta       `path:"/config/import" tags:"Config" method:"post" summary:"Import configs in batch"`
	Items        []ConfigItem `json:"items" v:"required|length:1,10000"`
	ChangeReason string       `json:"change_reason" v:"required"`
}

type ImportRes struct {
	Ok      bool `json:"ok"`
	Added   int  `json:"added"`
	Updated int  `json:"updated"`
}

type ExportReq struct {
	g.Meta    `path:"/config/export" tags:"Config" method:"get" summary:"Export configs"`
	Namespace string `json:"namespace"`
	Env       string `json:"env"`
	Enabled   *bool  `json:"enabled"`
}

type ExportRes struct {
	Items []ConfigItem `json:"items"`
}

// 刷新缓存
type RefreshReq struct {
	g.Meta `path:"/config/refresh" tags:"Config" method:"post" summary:"Rebuild config cache"`
	Reason string `json:"reason"`
}

type RefreshRes struct {
	Status    string `json:"status"`
	Entries   int    `json:"entries"`
	ElapsedMs int64  `json:"elapsed_ms"`
}

// 缓存统计
type StatsReq struct {
	g.Meta `path:"/config/stats" tags:"Config" method:"get" summary:"Get config cache stats"`
}

type StatsRes struct {
	Entries int `json:"entries"`
}

// IConfigV1 接口声明（用于 gf gen ctrl 生成控制器）
type IConfigV1 interface {
	List(ctx g.Ctx, req *ListReq) (res *ListRes, err error)
	Item(ctx g.Ctx, req *ItemReq) (res *ItemRes, err error)
	Create(ctx g.Ctx, req *CreateReq) (res *CreateRes, err error)
	Update(ctx g.Ctx, req *UpdateReq) (res *UpdateRes, err error)
	Delete(ctx g.Ctx, req *DeleteReq) (res *DeleteRes, err error)
	Versions(ctx g.Ctx, req *VersionsReq) (res *VersionsRes, err error)
	Rollback(ctx g.Ctx, req *RollbackReq) (res *RollbackRes, err error)
	Import(ctx g.Ctx, req *ImportReq) (res *ImportRes, err error)
	Export(ctx g.Ctx, req *ExportReq) (res *ExportRes, err error)
	Refresh(ctx g.Ctx, req *RefreshReq) (res *RefreshRes, err error)
	Stats(ctx g.Ctx, req *StatsReq) (res *StatsRes, err error)
}
