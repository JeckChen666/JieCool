package config

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/config/v1"
)

func (c *ControllerV1) Export(ctx context.Context, req *v1.ExportReq) (res *v1.ExportRes, err error) {
	m := g.DB().Ctx(ctx).Model("dynamic_configs")
	if req.Namespace != "" {
		m = m.Where("namespace", req.Namespace)
	}
	if req.Env != "" {
		m = m.Where("env", req.Env)
	}
	if req.Enabled != nil {
		m = m.Where("enabled", *req.Enabled)
	}
	rows, err := m.OrderDesc("updated_at").All()
	if err != nil {
		return nil, err
	}
	items := make([]v1.ConfigItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, v1.ConfigItem{
			Namespace:   r["namespace"].String(),
			Env:         r["env"].String(),
			Key:         r["key"].String(),
			Type:        r["type"].String(),
			Value:       r["value"].Val(),
			Enabled:     r["enabled"].Bool(),
			Version:     int(r["version"].Int()),
			Description: r["description"].String(),
			UpdatedBy:   r["updated_by"].String(),
			UpdatedAt:   r["updated_at"].String(),
		})
	}
	return &v1.ExportRes{Items: items}, nil
}
