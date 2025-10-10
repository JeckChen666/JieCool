// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package config

import (
	"context"

	v1 "server/api/config/v1"
)

type IConfigV1 interface {
	List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error)
	Item(ctx context.Context, req *v1.ItemReq) (res *v1.ItemRes, err error)
	Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error)
	Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error)
	Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error)
	Versions(ctx context.Context, req *v1.VersionsReq) (res *v1.VersionsRes, err error)
	Rollback(ctx context.Context, req *v1.RollbackReq) (res *v1.RollbackRes, err error)
	Import(ctx context.Context, req *v1.ImportReq) (res *v1.ImportRes, err error)
	Export(ctx context.Context, req *v1.ExportReq) (res *v1.ExportRes, err error)
	Refresh(ctx context.Context, req *v1.RefreshReq) (res *v1.RefreshRes, err error)
	Stats(ctx context.Context, req *v1.StatsReq) (res *v1.StatsRes, err error)
}
