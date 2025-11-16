package service

import (
	"context"
	"regexp"
	"strings"

	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/gogf/gf/v2/util/gconv"
	"github.com/google/uuid"

	"server/internal/dao"
	"server/internal/model/entity"
)

// BlogSimpleService 简化版博客服务
type BlogSimpleService struct{}

// BlogSimple 简化版博客服务实例
func BlogSimple() *BlogSimpleService {
	return &BlogSimpleService{}
}

// CreateArticle 创建博客文章
func (s *BlogSimpleService) CreateArticle(ctx context.Context, req map[string]interface{}) (*entity.BlogArticles, error) {
	title := gconv.String(req["title"])
	content := gconv.String(req["content"])
	slug := gconv.String(req["slug"])

	// 验证必填字段
	if title == "" {
		return nil, gerror.New("文章标题不能为空")
	}
	if content == "" {
		return nil, gerror.New("文章内容不能为空")
	}
	if slug == "" {
		return nil, gerror.New("文章URL标识不能为空")
	}

	// 检查slug是否已存在
	existURL, err := dao.BlogArticles.Ctx(ctx).Where("slug", slug).Count()
	if err != nil {
		return nil, gerror.Wrap(err, "检查URL标识失败")
	}
	if existURL > 0 {
		return nil, gerror.New("URL标识已存在，请更换")
	}

	// 验证分类是否存在
	categoryId := gconv.Int64(req["categoryId"])
	existCategory, err := dao.BlogCategories.Ctx(ctx).Where("id", categoryId).Count()
	if existCategory != 1 {
		return nil, gerror.New("分类不存在")
	}

	// 计算阅读时间
	readTime := len(content) / 200
	if readTime < 1 {
		readTime = 1
	}

	// 处理内容
	htmlContent := s.processMarkdown(content)

	// 生成摘要
	summary := gconv.String(req["summary"])
	if summary == "" {
		summary = s.generateSummary(content, 200)
	}

	// 设置发布时间
	status := gconv.String(req["status"])
	if status == "" {
		status = "draft"
	}

	var publishAt *gtime.Time
	if status == "published" {
		publishAt = gtime.Now()
	}

	// 构建插入数据，明确排除id字段，让数据库自动生成
	articleId := uuid.New().String()
	insertData := map[string]interface{}{
		"article_id":   articleId,
		"category_id":  categoryId,
		"title":        title,
		"slug":         slug,
		"summary":      summary,
		"content":      content,
		"html_content": htmlContent,
		"author_id":    1,
		"status":       status,
		"is_draft":     status != "published",
		"read_time":    readTime,
		"publish_at":   publishAt,
		"created_at":   gtime.Now(),
		"updated_at":   gtime.Now(),
	}

	// 插入数据并获取结果
	_, err = dao.BlogArticles.Ctx(ctx).Data(insertData).Insert()
	if err != nil {
		return nil, gerror.Wrap(err, "创建文章失败")
	}

	one, err := dao.BlogArticles.Ctx(ctx).Where("article_id", articleId).One()

	// 构建返回的文章对象
	article := &entity.BlogArticles{
		Id:          gconv.Int64(one["id"]),
		ArticleId:   insertData["article_id"].(string),
		CategoryId:  categoryId,
		Title:       title,
		Slug:        slug,
		Summary:     summary,
		Content:     content,
		HtmlContent: htmlContent,
		AuthorId:    1,
		Status:      status,
		IsDraft:     status != "published",
		ReadTime:    readTime,
		PublishAt:   publishAt,
		CreatedAt:   gtime.Now(),
		UpdatedAt:   gtime.Now(),
	}

	return article, nil
}

// ListArticles 获取文章列表
func (s *BlogSimpleService) ListArticles(ctx context.Context, page, size int, status string) ([]*entity.BlogArticles, int, error) {
	query := dao.BlogArticles.Ctx(ctx).Where("deleted_at IS NULL")

	// 状态过滤
	if status != "" {
		query = query.Where("status", status)
	} else {
		query = query.Where("status", "published")
	}

	// 分页参数
	if page <= 0 {
		page = 1
	}
	if size <= 0 {
		size = 10
	}

	// 查询总数
	total, err := query.Count()
	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询文章总数失败")
	}

	// 查询列表
	offset := (page - 1) * size
	var articles []*entity.BlogArticles
	err = query.Order("created_at DESC").
		Limit(offset, size).
		Scan(&articles)
	if err != nil {
		return nil, 0, gerror.Wrap(err, "查询文章列表失败")
	}

	return articles, total, nil
}

// GetArticle 获取文章详情
func (s *BlogSimpleService) GetArticle(ctx context.Context, id int64) (*entity.BlogArticles, error) {
	var article *entity.BlogArticles

	err := dao.BlogArticles.Ctx(ctx).Where("id", id).Where("deleted_at IS NULL").Scan(&article)
	if err != nil {
		return nil, gerror.Wrap(err, "查询文章失败")
	}
	if article == nil {
		return nil, gerror.New("文章不存在")
	}

	return article, nil
}

// UpdateArticle 更新博客文章
func (s *BlogSimpleService) UpdateArticle(ctx context.Context, req map[string]interface{}) error {
	id := gconv.Int64(req["id"])
	title := gconv.String(req["title"])
	content := gconv.String(req["content"])
	slug := gconv.String(req["slug"])

	// 验证必填字段
	if id <= 0 {
		return gerror.New("文章ID不能为空")
	}
	if title == "" {
		return gerror.New("文章标题不能为空")
	}
	if content == "" {
		return gerror.New("文章内容不能为空")
	}
	if slug == "" {
		return gerror.New("文章URL标识不能为空")
	}

	// 检查文章是否存在
	existArticle, err := dao.BlogArticles.Ctx(ctx).Where("id", id).Where("deleted_at IS NULL").One()
	if err != nil {
		return gerror.Wrap(err, "检查文章失败")
	}
	if existArticle.IsEmpty() {
		return gerror.New("文章不存在")
	}

	// 检查slug是否与其他文章冲突
	existSlug, err := dao.BlogArticles.Ctx(ctx).
		Where("slug", slug).
		Where("id != ?", id).
		Where("deleted_at IS NULL").
		Count()
	if err != nil {
		return gerror.Wrap(err, "检查URL标识失败")
	}
	if existSlug > 0 {
		return gerror.New("URL标识已存在，请更换")
	}

	// 验证分类是否存在
	categoryId := gconv.Int64(req["categoryId"])
	if categoryId > 0 {
		existCategory, err := dao.BlogCategories.Ctx(ctx).Where("id", categoryId).Count()
		if err != nil {
			return gerror.Wrap(err, "检查分类失败")
		}
		if existCategory != 1 {
			return gerror.New("分类不存在")
		}
	}

	// 计算阅读时间
	readTime := len(content) / 200
	if readTime < 1 {
		readTime = 1
	}

	// 处理内容
	htmlContent := s.processMarkdown(content)

	// 生成摘要
	summary := gconv.String(req["summary"])
	if summary == "" {
		summary = s.generateSummary(content, 200)
	}

	// 设置发布时间
	status := gconv.String(req["status"])
	if status == "" {
		status = "draft"
	}

	var publishAt *gtime.Time
	if status == "published" {
		publishAt = gtime.Now()
	}

	// 构建更新数据
	updateData := map[string]interface{}{
		"title":        title,
		"slug":         slug,
		"summary":      summary,
		"content":      content,
		"html_content": htmlContent,
		"category_id":  categoryId,
		"status":       status,
		"is_draft":     status != "published",
		"read_time":    readTime,
		"publish_at":   publishAt,
		"updated_at":   gtime.Now(),
	}

	// 可选字段
	if isTop, ok := req["isTop"].(bool); ok {
		updateData["is_top"] = isTop
	}
	if isPrivate, ok := req["isPrivate"].(bool); ok {
		updateData["is_private"] = isPrivate
	}
	if featuredImage := gconv.String(req["featuredImage"]); featuredImage != "" {
		updateData["featured_image"] = featuredImage
	}

	// 执行更新
	_, err = dao.BlogArticles.Ctx(ctx).
		Where("id", id).
		Data(updateData).
		Update()
	if err != nil {
		return gerror.Wrap(err, "更新文章失败")
	}

	g.Log().Info(ctx, "BlogSimpleService.UpdateArticle", "id", id, "title", title)

	return nil
}

// ListCategories 获取分类列表
func (s *BlogSimpleService) ListCategories(ctx context.Context) ([]*entity.BlogCategories, error) {
	var categories []*entity.BlogCategories

	err := dao.BlogCategories.Ctx(ctx).
		Where("is_active", true).
		Order("sort_order ASC, created_at ASC").
		Scan(&categories)
	if err != nil {
		return nil, gerror.Wrap(err, "查询分类列表失败")
	}

	return categories, nil
}

// processMarkdown 处理Markdown内容
func (s *BlogSimpleService) processMarkdown(content string) string {
	// 简单的Markdown到HTML转换
	html := strings.ReplaceAll(content, "\n\n", "</p><p>")
	html = "<p>" + html + "</p>"

	// 处理标题
	html = regexp.MustCompile(`^### (.+)$`).ReplaceAllString(html, "<h3>$1</h3>")
	html = regexp.MustCompile(`^## (.+)$`).ReplaceAllString(html, "<h2>$1</h2>")
	html = regexp.MustCompile(`^# (.+)$`).ReplaceAllString(html, "<h1>$1</h1>")

	// 处理代码块
	html = regexp.MustCompile("```(.*?)```").ReplaceAllString(html, "<pre><code>$1</code></pre>")

	// 处理粗体
	html = regexp.MustCompile(`\*\*(.+?)\*\*`).ReplaceAllString(html, "<strong>$1</strong>")

	// 处理斜体
	html = regexp.MustCompile(`\*(.+?)\*`).ReplaceAllString(html, "<em>$1</em>")

	return html
}

// generateSummary 生成文章摘要
func (s *BlogSimpleService) generateSummary(content string, maxLen int) string {
	// 移除Markdown标记
	plainText := regexp.MustCompile(`[#*`+"`"+`_\[\]()]+`).ReplaceAllString(content, "")
	plainText = strings.TrimSpace(plainText)

	// 移除多余空白
	plainText = regexp.MustCompile(`\s+`).ReplaceAllString(plainText, " ")

	// 截取指定长度
	if len(plainText) > maxLen {
		plainText = plainText[:maxLen] + "..."
	}

	return plainText
}
