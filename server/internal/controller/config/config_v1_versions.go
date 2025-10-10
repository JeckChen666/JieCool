package config

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/config/v1"
)

func (c *ControllerV1) Versions(ctx context.Context, req *v1.VersionsReq) (res *v1.VersionsRes, err error) {
	m := g.DB().Ctx(ctx).Model("dynamic_config_versions").Where(g.Map{
		"namespace": req.Namespace,
		"env":       req.Env,
		"key":       req.Key,
	})
	// 统计
	total, err := m.Clone().Count()
	if err != nil {
		return nil, err
	}
	page := req.Page
	if page <= 0 {
		page = 1
	}
	size := req.Size
	if size <= 0 {
		size = 20
	}
	if size > 200 {
		size = 200
	}
	rows, err := m.Page(page, size).OrderDesc("version").All()
	if err != nil {
		return nil, err
	}
	items := make([]v1.VersionItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, v1.VersionItem{
			Version:      int(r["version"].Int()),
			Value:        r["value"].Val(),
			ChangedBy:    r["changed_by"].String(),
			ChangeReason: r["change_reason"].String(),
			CreatedAt:    r["created_at"].String(),
		})
	}
	return &v1.VersionsRes{Items: items, Total: total}, nil
}
