package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// 微博模块 API 定义，遵循 gf gen ctrl 生成规范（Operation+Req/Res 与接口声明）

// 资产输入结构
type AssetInput struct {
	FileId    int64  `json:"fileId" v:"required"`                   // 文件系统 files.id
	Kind      string `json:"kind" v:"required|in:image,attachment"` // 资产类型
	SortOrder int    `json:"sortOrder" d:"0"`                       // 展示顺序
}

// 创建微博
type CreateReq struct {
	g.Meta     `path:"/weibo/posts" tags:"Weibo" method:"post" summary:"Create a weibo post"`
	Content    string       `json:"content" v:"required"`
	Visibility string       `json:"visibility" d:"public" v:"in:public,private"`
	Assets     []AssetInput `json:"assets"`
	// 位置与设备信息（城市可由前端解析或手填；IP 由后端记录）
	Lat    *float64 `json:"lat"`
	Lng    *float64 `json:"lng"`
	City   string   `json:"city"`
	Device string   `json:"device"`
}

type CreateRes struct {
	Id        int64  `json:"id"`
	CreatedAt string `json:"createdAt"`
}

// 编辑微博（生成快照）
type UpdateReq struct {
	g.Meta     `path:"/weibo/posts/update" tags:"Weibo" method:"put" summary:"Update a weibo post and create snapshot"`
	Id         int64        `json:"id" v:"required|min:1"`
	Content    string       `json:"content"`
	Visibility string       `json:"visibility" v:"in:public,private"`
	Assets     []AssetInput `json:"assets"`
	Lat        *float64     `json:"lat"`
	Lng        *float64     `json:"lng"`
	City       string       `json:"city"`
	Device     string       `json:"device"`
}

type UpdateRes struct {
	Updated         bool `json:"updated"`
	SnapshotVersion int  `json:"snapshotVersion"`
}

// 列表查询（分页）
type ListReq struct {
	g.Meta     `path:"/weibo/posts" tags:"Weibo" method:"get" summary:"List weibo posts with pagination" noAuth:"true"`
	Page       int    `json:"page" d:"1"`
	Size       int    `json:"size" d:"10"`
	Visibility string `json:"visibility" v:"in:public,private"`
}

type AssetItem struct {
	FileId int64  `json:"fileId"`
	Kind   string `json:"kind"`
}

type WeiboItem struct {
	Id         int64       `json:"id"`
	Content    string      `json:"content"`
	Visibility string      `json:"visibility"`
	CreatedAt  string      `json:"createdAt"`
	City       string      `json:"city"`
	Lat        *float64    `json:"lat"`
	Lng        *float64    `json:"lng"`
	Device     string      `json:"device"`
	Assets     []AssetItem `json:"assets"`
}

type ListRes struct {
	Page  int         `json:"page"`
	Size  int         `json:"size"`
	Total int         `json:"total"`
	List  []WeiboItem `json:"list"`
}

// 详情
type DetailReq struct {
	g.Meta `path:"/weibo/posts/detail" tags:"Weibo" method:"get" summary:"Get weibo post detail" noAuth:"true"`
	Id     int64 `json:"id" v:"required|min:1"`
}

type DetailRes struct {
	Id         int64       `json:"id"`
	Content    string      `json:"content"`
	Visibility string      `json:"visibility"`
	CreatedAt  string      `json:"createdAt"`
	UpdatedAt  string      `json:"updatedAt"`
	City       string      `json:"city"`
	Lat        *float64    `json:"lat"`
	Lng        *float64    `json:"lng"`
	Device     string      `json:"device"`
	Assets     []AssetItem `json:"assets"`
}

// 快照列表
type SnapshotsReq struct {
	g.Meta `path:"/weibo/posts/snapshots" tags:"Weibo" method:"get" summary:"List snapshots of a weibo post" noAuth:"true"`
	PostId int64 `json:"postId" v:"required|min:1"`
	Page   int   `json:"page" d:"1"`
	Size   int   `json:"size" d:"10"`
}

type SnapshotItem struct {
	Id         int64  `json:"id"`
	Version    int    `json:"version"`
	CreatedAt  string `json:"createdAt"`
	Visibility string `json:"visibility"`
}

type SnapshotsRes struct {
	Page  int            `json:"page"`
	Size  int            `json:"size"`
	Total int            `json:"total"`
	Items []SnapshotItem `json:"items"`
}

// 单个快照详情
type SnapshotReq struct {
	g.Meta `path:"/weibo/snapshot" tags:"Weibo" method:"get" summary:"Get snapshot detail" noAuth:"true"`
	Id     int64 `json:"id" v:"required|min:1"`
}

type SnapshotRes struct {
	Id         int64       `json:"id"`
	Version    int         `json:"version"`
	CreatedAt  string      `json:"createdAt"`
	Visibility string      `json:"visibility"`
	Content    string      `json:"content"`
	Assets     []AssetItem `json:"assets"` // 来自 snapshot_meta 中的 fileId 列表
}

// 删除（软删除预留）
type DeleteReq struct {
	g.Meta `path:"/weibo/posts/delete" tags:"Weibo" method:"delete" summary:"Soft delete a weibo post"`
	Id     int64 `json:"id" v:"required|min:1"`
}

type DeleteRes struct {
	Ok bool `json:"ok"`
}

// IWeiboV1 接口声明（用于 gf gen ctrl 生成控制器）
type IWeiboV1 interface {
	Create(ctx g.Ctx, req *CreateReq) (res *CreateRes, err error)
	Update(ctx g.Ctx, req *UpdateReq) (res *UpdateRes, err error)
	List(ctx g.Ctx, req *ListReq) (res *ListRes, err error)
	Detail(ctx g.Ctx, req *DetailReq) (res *DetailRes, err error)
	Snapshots(ctx g.Ctx, req *SnapshotsReq) (res *SnapshotsRes, err error)
	Snapshot(ctx g.Ctx, req *SnapshotReq) (res *SnapshotRes, err error)
	Delete(ctx g.Ctx, req *DeleteReq) (res *DeleteRes, err error)
}
