package blog

import (
	"context"

	"server/api/blog/v1"
	"server/internal/service"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
)

func (c *ControllerV1) Update(ctx context.Context, req *v1.UpdateReq) (res *v1.UpdateRes, err error) {
	// 转换请求为服务层所需的map格式
	serviceReq := map[string]interface{}{
		"id":            req.Id,
		"title":         req.Title,
		"slug":          req.Slug,
		"summary":       req.Summary,
		"content":       req.Content,
		"categoryId":    req.CategoryId,
		"status":        req.Status,
		"isDraft":       req.IsDraft,
		"isTop":         req.IsTop,
		"isPrivate":     req.IsPrivate,
		"featuredImage": req.FeaturedImage,
		"publishAt":     req.PublishAt,
	}

	// 调用服务层更新文章
	err = service.BlogSimple().UpdateArticle(ctx, serviceReq)
	if err != nil {
		g.Log().Error(ctx, "ControllerV1.Update", "error", err, "req", req)
		return nil, gerror.WrapCode(gcode.CodeInternalError, err, "更新文章失败")
	}

	g.Log().Info(ctx, "ControllerV1.Update", "articleId", req.Id, "title", req.Title)

	return &v1.UpdateRes{
		Updated: true,
	}, nil
}
