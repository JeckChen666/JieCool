// =================================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// =================================================================================

package weibo

import (
	"context"

	"server/api/weibo/v1"
)

type IWeiboV1 interface {
	Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error)
	Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error)
	List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error)
	Detail(ctx context.Context, req *v1.DetailReq) (res *v1.DetailRes, err error)
	Snapshots(ctx context.Context, req *v1.SnapshotsReq) (res *v1.SnapshotsRes, err error)
	Snapshot(ctx context.Context, req *v1.SnapshotReq) (res *v1.SnapshotRes, err error)
	Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error)
}
