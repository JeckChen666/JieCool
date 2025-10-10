package config

import (
    "context"

    "github.com/gogf/gf/v2/frame/g"

    v1 "server/api/config/v1"
    "server/internal/logic/configutil"
)

func (c *ControllerV1) List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error) {
	// 构建查询
	m := g.DB().Ctx(ctx).Model("dynamic_configs")
	if req.Namespace != "" {
		m = m.Where("namespace", req.Namespace)
	}
	if req.Env != "" {
		m = m.Where("env", req.Env)
	}
	if req.KeyLike != "" {
		m = m.WhereLike("key", "%"+req.KeyLike+"%")
	}
	if req.Enabled != nil {
		m = m.Where("enabled", *req.Enabled)
	}

	// 统计总数
	total, err := m.Clone().Count()
	if err != nil {
		return nil, err
	}

	// 分页查询
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
	rows, err := m.Page(page, size).OrderDesc("updated_at").All()
	if err != nil {
		return nil, err
	}

    items := make([]v1.ConfigItem, 0, len(rows))
    for _, r := range rows {
        // Decode JSON text from DB into proper Go value for API response
        valueDecoded := configutil.DecodeJSONText(r["value"].String())
        items = append(items, v1.ConfigItem{
            Namespace:   r["namespace"].String(),
            Env:         r["env"].String(),
            Key:         r["key"].String(),
            Type:        r["type"].String(),
            Value:       valueDecoded,
            Enabled:     r["enabled"].Bool(),
            Version:     int(r["version"].Int()),
            Description: r["description"].String(),
            UpdatedBy:   r["updated_by"].String(),
            UpdatedAt:   r["updated_at"].String(),
        })
    }

	return &v1.ListRes{Items: items, Total: total}, nil
}
