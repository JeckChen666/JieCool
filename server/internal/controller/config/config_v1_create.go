package config

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	v1 "server/api/config/v1"
	"server/internal/logic/configutil"
	"server/internal/service/configcache"
)

func (c *ControllerV1) Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error) {
	// 仅管理员可执行
	r := g.RequestFromCtx(ctx)
	subj := r.GetCtxVar("auth.subject").String()
	if subj == "" || subj != "admin" {
		return nil, gerror.New("forbidden")
	}
	// 检查是否已存在
	exists, err := g.DB().Ctx(ctx).Model("dynamic_configs").Where(g.Map{
		"namespace": req.Namespace,
		"env":       req.Env,
		"key":       req.Key,
	}).Count()
	if err != nil {
		return nil, err
	}
	if exists > 0 {
		return &v1.CreateRes{Ok: false}, gerror.New("config already exists")
	}

	// 规范化 value 为合法 JSON 文本，避免 JSONB 语法错误
	normalized, err := configutil.NormalizeJSONValue(req.Type, req.Value)
	if err != nil {
		return nil, err
	}

	// 事务：写入当前表与版本表
	err = g.DB().Ctx(ctx).Transaction(ctx, func(txCtx context.Context, tx gdb.TX) error {
		// 插入 dynamic_configs
		_, err := tx.Model("dynamic_configs").Insert(g.Map{
			"namespace":   req.Namespace,
			"env":         req.Env,
			"key":         req.Key,
			"type":        req.Type,
			"value":       normalized,
			"enabled":     req.Enabled,
			"version":     1,
			"description": req.Description,
			// updated_by 留空或取上下文，当前忽略鉴权
		})
		if err != nil {
			return err
		}
		// 插入 dynamic_config_versions
		_, err = tx.Model("dynamic_config_versions").Insert(g.Map{
			"namespace":     req.Namespace,
			"env":           req.Env,
			"key":           req.Key,
			"version":       1,
			"type":          req.Type,
			"value":         normalized,
			"enabled":       req.Enabled,
			"description":   req.Description,
			"change_reason": req.ChangeReason,
		})
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	// 重建缓存
	_, _, _ = configcache.Rebuild(ctx)
	return &v1.CreateRes{Ok: true}, nil
}
