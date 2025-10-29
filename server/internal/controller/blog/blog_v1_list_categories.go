package blog

import (
	"context"

	"server/api/blog/v1"
	"server/internal/service"
)

func (c *ControllerV1) ListCategories(ctx context.Context, req *v1.ListCategoriesReq) (res *v1.ListCategoriesRes, err error) {
	// 调用简化版服务层获取分类列表
	categories, err := service.BlogSimple().ListCategories(ctx)
	if err != nil {
		return nil, err
	}

	// 转换为响应格式
	var list []v1.CategoryItem
	for _, category := range categories {
		// 处理父分类ID
		var parentId *int64
		if category.ParentId > 0 {
			parentId = &category.ParentId
		}

		item := v1.CategoryItem{
			Id:           category.Id,
			Name:         category.Name,
			Slug:         category.Slug,
			ParentId:     parentId,
			SortOrder:    category.SortOrder,
			Description:  category.Description,
			ArticleCount: category.ArticleCount,
			IsActive:     category.IsActive,
			CreatedAt:    category.CreatedAt.String(),
			UpdatedAt:    category.UpdatedAt.String(),
		}
		list = append(list, item)
	}

	return &v1.ListCategoriesRes{
		List: list,
	}, nil
}
