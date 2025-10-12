package weibo

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/weibo/v1"
	"server/internal/service"
)

func (c *ControllerV1) Snapshot(ctx context.Context, req *v1.SnapshotReq) (res *v1.SnapshotRes, err error) {
	s, metaAssets, err := service.Weibo().Snapshot(ctx, req.Id)
	if err != nil {
		return nil, gerror.Wrap(err, "查询快照详情失败")
	}
	return &v1.SnapshotRes{
		Id:      s.Id,
		Version: s.Version,
		CreatedAt: func() string {
			if s.CreatedAt != nil {
				return s.CreatedAt.String()
			}
			return ""
		}(),
		Visibility: s.SnapshotVisibility,
		Content:    s.SnapshotContent,
		Assets:     metaAssets,
	}, nil
}
