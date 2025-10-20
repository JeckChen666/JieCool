package config

import (
	"context"
	"server/internal/logic/utils"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"

	v1 "server/api/config/v1"
	"server/internal/service/configcache"
)

func (c *ControllerV1) Import(ctx context.Context, req *v1.ImportReq) (res *v1.ImportRes, err error) {
	// 仅管理员可执行
	r := g.RequestFromCtx(ctx)
	subj := r.GetCtxVar("auth.subject").String()
	if subj == "" || subj != "admin" {
		return nil, gerror.New("forbidden")
	}
	added := 0
	updated := 0
	err = g.DB().Ctx(ctx).Transaction(ctx, func(txCtx context.Context, tx gdb.TX) error {
		for _, it := range req.Items {
			// 为每个条目规范化 JSON 值
			normalized, nErr := utils.NormalizeJSONValue(it.Type, it.Value)
			if nErr != nil {
				return nErr
			}
			// 是否存在
			cur, err := tx.Model("dynamic_configs").Where(g.Map{
				"namespace": it.Namespace,
				"env":       it.Env,
				"key":       it.Key,
			}).One()
			if err != nil {
				return err
			}
			if cur == nil {
				// 新增
				_, err = tx.Model("dynamic_configs").Insert(g.Map{
					"namespace":   it.Namespace,
					"env":         it.Env,
					"key":         it.Key,
					"type":        it.Type,
					"value":       normalized,
					"enabled":     it.Enabled,
					"version":     1,
					"description": it.Description,
				})
				if err != nil {
					return err
				}
				_, err = tx.Model("dynamic_config_versions").Insert(g.Map{
					"namespace":     it.Namespace,
					"env":           it.Env,
					"key":           it.Key,
					"version":       1,
					"type":          it.Type,
					"value":         normalized,
					"enabled":       it.Enabled,
					"description":   it.Description,
					"change_reason": req.ChangeReason,
				})
				if err != nil {
					return err
				}
				added++
			} else {
				// 更新为新版本
				newVer := int(cur["version"].Int()) + 1
				_, err = tx.Model("dynamic_configs").Where(g.Map{
					"namespace": it.Namespace,
					"env":       it.Env,
					"key":       it.Key,
				}).Update(g.Map{
					"type":        it.Type,
					"value":       normalized,
					"enabled":     it.Enabled,
					"description": it.Description,
					"version":     newVer,
					"updated_at":  gtime.Now(),
				})
				if err != nil {
					return err
				}
				_, err = tx.Model("dynamic_config_versions").Insert(g.Map{
					"namespace":     it.Namespace,
					"env":           it.Env,
					"key":           it.Key,
					"version":       newVer,
					"type":          it.Type,
					"value":         normalized,
					"enabled":       it.Enabled,
					"description":   it.Description,
					"change_reason": req.ChangeReason,
				})
				if err != nil {
					return err
				}
				updated++
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	_, _, _ = configcache.Rebuild(ctx)
	return &v1.ImportRes{Ok: true, Added: added, Updated: updated}, nil
}
