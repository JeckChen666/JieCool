package blog

import (
	"context"

	"server/api/blog/v1"
	"server/internal/service"
)

func (c *ControllerV1) Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error) {
	// 调用简化版服务层创建文章
	result, err := service.BlogSimple().CreateArticle(ctx, map[string]interface{}{
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
	})
	if err != nil {
		return nil, err
	}

	return &v1.CreateRes{
		Id:        result.Id,
		CreatedAt: result.CreatedAt.String(),
	}, nil
}
