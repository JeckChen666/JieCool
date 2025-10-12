package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) Snapshots(ctx context.Context, req *v1.SnapshotsReq) (res *v1.SnapshotsRes, err error) {
	items, total, err := service.Weibo().Snapshots(ctx, req.PostId, req.Page, req.Size)
	if err != nil {
		return nil, gerror.Wrap(err, "查询微博快照失败")
	}
	out := make([]v1.SnapshotItem, 0, len(items))
	for _, s := range items {
		out = append(out, v1.SnapshotItem{
			Id:      s.Id,
			Version: s.Version,
			CreatedAt: func() string {
				if s.CreatedAt != nil {
					return s.CreatedAt.String()
				}
				return ""
			}(),
			Visibility: s.SnapshotVisibility,
		})
	}
	page := req.Page
	size := req.Size
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}
	return &v1.SnapshotsRes{Page: page, Size: size, Total: total, Items: out}, nil
}
