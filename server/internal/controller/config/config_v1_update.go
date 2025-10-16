package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "server/api/config/v1"
	"server/internal/logic/configutil"
	"server/internal/service/configcache"
)

func (c *ControllerV1) Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error) {
	// 仅管理员可执行
	r := g.RequestFromCtx(ctx)
	subj := r.GetCtxVar("auth.subject").String()
	if subj == "" || subj != "admin" {
		return nil, gerror.New("forbidden")
	}
	// 读取当前版本
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

	// 规范化 value 为合法 JSON 文本
	normalized, err := configutil.NormalizeJSONValue(req.Type, req.Value)
	if err != nil {
		return nil, err
	}

	err = g.DB().Ctx(ctx).Transaction(ctx, func(txCtx context.Context, tx gdb.TX) error {
		// 更新当前表
		_, err := tx.Model("dynamic_configs").Where(g.Map{
			"namespace": req.Namespace,
			"env":       req.Env,
			"key":       req.Key,
		}).Update(g.Map{
			"type":        req.Type,
			"value":       normalized,
			"enabled":     req.Enabled,
			"description": req.Description,
			"version":     newVer,
			"updated_at":  gtime.Now(),
		})
		if err != nil {
			return err
		}
		// 记录版本
		_, err = tx.Model("dynamic_config_versions").Insert(g.Map{
			"namespace":     req.Namespace,
			"env":           req.Env,
			"key":           req.Key,
			"version":       newVer,
			"type":          req.Type,
			"value":         normalized,
			"enabled":       req.Enabled,
			"description":   req.Description,
			"change_reason": req.ChangeReason,
		})
		return err
	})
	if err != nil {
		return nil, err
	}

	// 重建缓存
	_, _, _ = configcache.Rebuild(ctx)
	return &v1.UpdateRes{Ok: true}, nil
}
