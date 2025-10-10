package config

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/config/v1"
)

func (c *ControllerV1) Item(ctx context.Context, req *v1.ItemReq) (res *v1.ItemRes, err error) {
	r, err := g.DB().Ctx(ctx).Model("dynamic_configs").Where(g.Map{
		"namespace": req.Namespace,
		"env":       req.Env,
		"key":       req.Key,
	}).One()
	if err != nil {
		return nil, err
	}
	if r == nil {
		return &v1.ItemRes{Item: nil}, nil
	}
	item := &v1.ConfigItem{
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
	}
	return &v1.ItemRes{Item: item}, nil
}
