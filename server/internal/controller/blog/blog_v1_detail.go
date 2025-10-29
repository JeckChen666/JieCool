package blog

import (
	"context"
	"time"

	"server/api/blog/v1"
	"server/internal/service"
)

func (c *ControllerV1) Detail(ctx context.Context, req *v1.DetailReq) (res *v1.DetailRes, err error) {
	// 调用简化版服务层获取文章详情
	article, err := service.BlogSimple().GetArticle(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	// 获取文章标签
	tags, _ := c.getArticleTags(ctx, article.Id)

	// 获取分类信息
	categoryName := ""
	if article.CategoryId > 0 {
		// TODO: 实现获取分类信息的逻辑
		categoryName = "默认分类"
	}

	// 转换标签格式
	var tagItems []v1.TagItem
	for _, tag := range tags {
		tagItems = append(tagItems, v1.TagItem{
			Id:   tag.Id,
			Name: tag.Name,
			Slug: tag.Slug,
		})
	}

	// 时间转换
	var publishAt *time.Time
	if article.PublishAt != nil {
		publishAt = &article.PublishAt.Time
	}

	// 构建响应
	return &v1.DetailRes{
		Id:            article.Id,
		Title:         article.Title,
		Slug:          article.Slug,
		Summary:       article.Summary,
		Content:       article.Content,
		HtmlContent:   article.HtmlContent,
		CategoryId:    article.CategoryId,
		CategoryName:  categoryName,
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
		Tags:          tagItems,
		SEO: v1.SEOData{
			MetaTitle:       "", // TODO: 从SEO表获取
			MetaDescription: "",
			MetaKeywords:    "",
			OGTitle:         "",
			OGDescription:   "",
			OGImage:         "",
			TwitterTitle:    "",
			TwitterDesc:     "",
			TwitterImage:    "",
			CanonicalURL:    "",
		},
	}, nil
}
