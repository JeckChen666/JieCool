package blog

import (
	"context"
	"time"

	"server/api/blog/v1"
	"server/internal/dao"
	"server/internal/model/entity"
	"server/internal/service"
)

func (c *ControllerV1) List(ctx context.Context, req *v1.ListReq) (res *v1.ListRes, err error) {
	// 调用简化版服务层获取文章列表
	articles, total, err := service.BlogSimple().ListArticles(ctx, req.Page, req.Size, req.Status)
	if err != nil {
		return nil, err
	}

	// 转换为响应格式
	var list []v1.ArticleItem
	for _, article := range articles {
		// 获取文章标签
		tags, _ := c.getArticleTags(ctx, article.Id)

		// 时间转换
		var publishAt *time.Time
		if article.PublishAt != nil {
			publishAt = &article.PublishAt.Time
		}

		item := v1.ArticleItem{
			Id:            article.Id,
			Title:         article.Title,
			Slug:          article.Slug,
			Summary:       article.Summary,
			CategoryId:    article.CategoryId,
			CategoryName:  "", // 需要通过关联查询获取
			Status:        article.Status,
			IsDraft:       article.IsDraft,
			IsTop:         article.IsTop,
			IsPrivate:     article.IsPrivate,
			ViewCount:     article.ViewCount,
			LikeCount:     article.LikeCount,
			CommentCount:  article.CommentCount,
			ShareCount:    article.ShareCount,
			FeaturedImage: article.FeaturedImage,
			ReadTime:      article.ReadTime,
			PublishAt:     publishAt,
			CreatedAt:     article.CreatedAt.Time,
			UpdatedAt:     article.UpdatedAt.Time,
		}

		// 转换标签
		for _, tag := range tags {
			item.Tags = append(item.Tags, v1.TagItem{
				Id:   tag.Id,
				Name: tag.Name,
				Slug: tag.Slug,
			})
		}

		list = append(list, item)
	}

	return &v1.ListRes{
		Page:  req.Page,
		Size:  req.Size,
		Total: total,
		List:  list,
	}, nil
}

// getArticleTags 获取文章标签（辅助方法）
func (c *ControllerV1) getArticleTags(ctx context.Context, articleId int64) ([]*entity.BlogTags, error) {
	var tags []*entity.BlogTags

	err := dao.BlogTags.Ctx(ctx).
		Fields("blog_tags.id", "blog_tags.tag_id", "blog_tags.name", "blog_tags.slug",
			"blog_tags.description", "blog_tags.color", "blog_tags.article_count",
			"blog_tags.is_active", "blog_tags.created_at", "blog_tags.updated_at").
		InnerJoin("blog_article_tags", "blog_tags.id = blog_article_tags.tag_id").
		Where("blog_article_tags.article_id", articleId).
		Where("blog_tags.is_active", true).
		Order("blog_tags.name").
		Scan(&tags)

	return tags, err
}
