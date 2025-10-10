package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "server/api/config/v1"
	"server/internal/service/configcache"
)

func (c *ControllerV1) Delete(ctx context.Context, req *v1.DeleteReq) (res *v1.DeleteRes, err error) {
	// 软删除：enabled=false 并版本+1
	cur, err := g.DB().Ctx(ctx).Model("dynamic_configs").Where(g.Map{
		"namespace": req.Namespace,
		"env":       req.Env,
		"key":       req.Key,
	}).One()
	if err != nil {
		return nil, err
	}
	if cur == nil {
		return nil, gerror.New("config not found")
	}
	curVer := int(cur["version"].Int())
	if curVer != req.Version {
		return nil, gerror.New("version conflict")
	}
	newVer := curVer + 1

	err = g.DB().Ctx(ctx).Transaction(ctx, func(txCtx context.Context, tx gdb.TX) error {
		_, err := tx.Model("dynamic_configs").Where(g.Map{
			"namespace": req.Namespace,
			"env":       req.Env,
			"key":       req.Key,
		}).Update(g.Map{
			"enabled":    false,
			"version":    newVer,
			"updated_at": gtime.Now(),
		})
		if err != nil {
			return err
		}
		_, err = tx.Model("dynamic_config_versions").Insert(g.Map{
			"namespace":     req.Namespace,
			"env":           req.Env,
			"key":           req.Key,
			"version":       newVer,
			"type":          cur["type"].String(),
			"value":         cur["value"].Val(),
			"enabled":       false,
			"description":   cur["description"].String(),
			"change_reason": req.ChangeReason,
		})
		return err
	})
	if err != nil {
		return nil, err
	}
	_, _, _ = configcache.Rebuild(ctx)
	return &v1.DeleteRes{Ok: true}, nil
}
