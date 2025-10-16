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

func (c *ControllerV1) Rollback(ctx context.Context, req *v1.RollbackReq) (res *v1.RollbackRes, err error) {
	// 仅管理员可执行
	r := g.RequestFromCtx(ctx)
	subj := r.GetCtxVar("auth.subject").String()
	if subj == "" || subj != "admin" {
		return nil, gerror.New("forbidden")
	}
	// 获取目标版本
	target, err := g.DB().Ctx(ctx).Model("dynamic_config_versions").Where(g.Map{
		"namespace": req.Namespace,
		"env":       req.Env,
		"key":       req.Key,
		"version":   req.ToVersion,
	}).One()
	if err != nil {
		return nil, err
	}
	if target == nil {
		return nil, gerror.New("target version not found")
	}
	// 当前版本
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
	newVer := int(cur["version"].Int()) + 1

	err = g.DB().Ctx(ctx).Transaction(ctx, func(txCtx context.Context, tx gdb.TX) error {
		// 更新为目标版本的值
		_, err := tx.Model("dynamic_configs").Where(g.Map{
			"namespace": req.Namespace,
			"env":       req.Env,
			"key":       req.Key,
		}).Update(g.Map{
			"type":        target["type"].String(),
			"value":       target["value"].Val(),
			"enabled":     target["enabled"].Bool(),
			"description": target["description"].String(),
			"version":     newVer,
			"updated_at":  gtime.Now(),
		})
		if err != nil {
			return err
		}
		// 记录新的版本（回滚发生一次新的版本）
		_, err = tx.Model("dynamic_config_versions").Insert(g.Map{
			"namespace":     req.Namespace,
			"env":           req.Env,
			"key":           req.Key,
			"version":       newVer,
			"type":          target["type"].String(),
			"value":         target["value"].Val(),
			"enabled":       target["enabled"].Bool(),
			"description":   target["description"].String(),
			"change_reason": req.ChangeReason,
		})
		return err
	})
	if err != nil {
		return nil, err
	}
	_, _, _ = configcache.Rebuild(ctx)
	return &v1.RollbackRes{Ok: true}, nil
}
