package v1

import (
	"time"

	"github.com/gogf/gf/v2/frame/g"
)

// 博客模块 API 定义，遵循 gf gen ctrl 生成规范

// SEO数据输入结构
type SEOInput struct {
	MetaTitle       string `json:"metaTitle"`       // SEO标题
	MetaDescription string `json:"metaDescription"` // SEO描述
	MetaKeywords    string `json:"metaKeywords"`    // SEO关键词
	OGTitle         string `json:"ogTitle"`         // Open Graph标题
	OGDescription   string `json:"ogDescription"`   // Open Graph描述
	OGImage         string `json:"ogImage"`         // Open Graph图片
	TwitterTitle    string `json:"twitterTitle"`    // Twitter标题
	TwitterDesc     string `json:"twitterDesc"`     // Twitter描述
	TwitterImage    string `json:"twitterImage"`    // Twitter图片
	CanonicalURL    string `json:"canonicalUrl"`    // 规范URL
}

// 标签输入结构
type TagInput struct {
	Name string `json:"name" v:"required"` // 标签名称
}

// 创建博客文章
type CreateReq struct {
	g.Meta        `path:"/blog/articles" tags:"Blog" method:"post" summary:"Create a blog article"`
	Title         string     `json:"title" v:"required|length:3,255"`                         // 文章标题
	Slug          string     `json:"slug" v:"required|length:3,255"`                          // URL友好标识
	Summary       string     `json:"summary" v:"length:0,500"`                                // 文章摘要
	Content       string     `json:"content" v:"required"`                                    // Markdown内容
	CategoryId    int64      `json:"categoryId" v:"min:1"`                                    // 分类ID
	Tags          []TagInput `json:"tags"`                                                    // 标签列表
	Status        string     `json:"status" d:"draft" v:"in:draft,published,private,archive"` // 文章状态
	IsDraft       bool       `json:"isDraft" d:"true"`                                        // 是否为草稿
	IsTop         bool       `json:"isTop" d:"false"`                                         // 是否置顶
	IsPrivate     bool       `json:"isPrivate" d:"false"`                                     // 是否私密
	FeaturedImage string     `json:"featuredImage"`                                           // 特色图片URL
	PublishAt     *time.Time `json:"publishAt"`                                               // 发布时间
	SEO           SEOInput   `json:"seo"`                                                     // SEO数据
}

type CreateRes struct {
	Id        int64  `json:"id"`
	CreatedAt string `json:"createdAt"`
}

// 更新博客文章
type UpdateReq struct {
	g.Meta        `path:"/blog/articles" tags:"Blog" method:"put" summary:"Update a blog article"`
	Id            int64      `json:"id" v:"required|min:1"`
	Title         string     `json:"title" v:"required|length:3,255"`
	Slug          string     `json:"slug" v:"required|length:3,255"`
	Summary       string     `json:"summary" v:"length:0,500"`
	Content       string     `json:"content" v:"required"`
	CategoryId    int64      `json:"categoryId" v:"min:1"`
	Tags          []TagInput `json:"tags"`
	Status        string     `json:"status" v:"in:draft,published,private,archive"`
	IsDraft       bool       `json:"isDraft"`
	IsTop         bool       `json:"isTop"`
	IsPrivate     bool       `json:"isPrivate"`
	FeaturedImage string     `json:"featuredImage"`
	PublishAt     *time.Time `json:"publishAt"`
	SEO           SEOInput   `json:"seo"`
}

type UpdateRes struct {
	Updated bool `json:"updated"`
}

// 文章列表查询（分页）
type ListReq struct {
	g.Meta     `path:"/blog/articles" tags:"Blog" method:"get" summary:"List blog articles with pagination" noAuth:"true"`
	Page       int    `json:"page" d:"1"`
	Size       int    `json:"size" d:"10"`
	CategoryId int64  `json:"categoryId"`
	Tag        string `json:"tag"`
	Status     string `json:"status"`
	Search     string `json:"search"`
}

type TagItem struct {
	Id   int64  `json:"id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type ArticleItem struct {
	Id            int64      `json:"id"`
	Title         string     `json:"title"`
	Slug          string     `json:"slug"`
	Summary       string     `json:"summary"`
	CategoryId    int64      `json:"categoryId"`
	CategoryName  string     `json:"categoryName"`
	Status        string     `json:"status"`
	IsDraft       bool       `json:"isDraft"`
	IsTop         bool       `json:"isTop"`
	IsPrivate     bool       `json:"isPrivate"`
	ViewCount     int        `json:"viewCount"`
	LikeCount     int        `json:"likeCount"`
	CommentCount  int        `json:"commentCount"`
	ShareCount    int        `json:"shareCount"`
	FeaturedImage string     `json:"featuredImage"`
	ReadTime      int        `json:"readTime"`
	PublishAt     *time.Time `json:"publishAt"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	Tags          []TagItem  `json:"tags"`
}

type ListRes struct {
	Page  int           `json:"page"`
	Size  int           `json:"size"`
	Total int           `json:"total"`
	List  []ArticleItem `json:"list"`
}

// 文章详情
type DetailReq struct {
	g.Meta        `path:"/blog/articles/detail" tags:"Blog" method:"get" summary:"Get blog article detail" noAuth:"true"`
	Id            int64 `json:"id" v:"required|min:1"`
	IncrementView bool  `json:"incrementView" d:"true"` // 是否增加浏览次数
}

type SEOData struct {
	MetaTitle       string `json:"metaTitle"`
	MetaDescription string `json:"metaDescription"`
	MetaKeywords    string `json:"metaKeywords"`
	OGTitle         string `json:"ogTitle"`
	OGDescription   string `json:"ogDescription"`
	OGImage         string `json:"ogImage"`
	TwitterTitle    string `json:"twitterTitle"`
	TwitterDesc     string `json:"twitterDesc"`
	TwitterImage    string `json:"twitterImage"`
	CanonicalURL    string `json:"canonicalUrl"`
}

type DetailRes struct {
	Id            int64      `json:"id"`
	Title         string     `json:"title"`
	Slug          string     `json:"slug"`
	Summary       string     `json:"summary"`
	Content       string     `json:"content"`     // Markdown内容
	HtmlContent   string     `json:"htmlContent"` // HTML渲染内容
	CategoryId    int64      `json:"categoryId"`
	CategoryName  string     `json:"categoryName"`
	Status        string     `json:"status"`
	IsDraft       bool       `json:"isDraft"`
	IsTop         bool       `json:"isTop"`
	IsPrivate     bool       `json:"isPrivate"`
	ViewCount     int        `json:"viewCount"`
	LikeCount     int        `json:"likeCount"`
	CommentCount  int        `json:"commentCount"`
	ShareCount    int        `json:"shareCount"`
	FeaturedImage string     `json:"featuredImage"`
	ReadTime      int        `json:"readTime"`
	PublishAt     *time.Time `json:"publishAt"`
	CreatedAt     time.Time  `json:"createdAt"`
	UpdatedAt     time.Time  `json:"updatedAt"`
	Tags          []TagItem  `json:"tags"`
	SEO           SEOData    `json:"seo"`
}

// 删除文章（软删除）
type DeleteReq struct {
	g.Meta `path:"/blog/articles" tags:"Blog" method:"delete" summary:"Delete a blog article"`
	Id     int64 `json:"id" v:"required|min:1"`
}

type DeleteRes struct {
	Deleted bool `json:"deleted"`
}

// 分类管理
type CreateCategoryReq struct {
	g.Meta      `path:"/blog/categories" tags:"Blog" method:"post" summary:"Create a blog category"`
	Name        string `json:"name" v:"required|length:2,100"`
	Slug        string `json:"slug" v:"required|length:2,100"`
	ParentId    *int64 `json:"parentId"`
	SortOrder   int    `json:"sortOrder" d:"0"`
	Description string `json:"description"`
}

type CreateCategoryRes struct {
	Id        int64  `json:"id"`
	CreatedAt string `json:"createdAt"`
}

type ListCategoriesReq struct {
	g.Meta `path:"/blog/categories" tags:"Blog" method:"get" summary:"List blog categories" noAuth:"true"`
}

type CategoryItem struct {
	Id           int64  `json:"id"`
	CategoryId   string `json:"categoryId"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	ParentId     *int64 `json:"parentId"`
	SortOrder    int    `json:"sortOrder"`
	Description  string `json:"description"`
	ArticleCount int    `json:"articleCount"`
	IsActive     bool   `json:"isActive"`
	CreatedAt    string `json:"createdAt"`
	UpdatedAt    string `json:"updatedAt"`
}

type ListCategoriesRes struct {
	List []CategoryItem `json:"list"`
}

// 评论管理
type CreateCommentReq struct {
	g.Meta         `path:"/blog/comments" tags:"Blog" method:"post" summary:"Create a blog comment" noAuth:"true"`
	ArticleId      int64  `json:"articleId" v:"required|min:1"`
	ParentId       *int64 `json:"parentId"`                             // 父评论ID（支持回复）
	VisitorName    string `json:"visitorName" v:"required|length:2,50"` // 访客昵称
	VisitorEmail   string `json:"visitorEmail" v:"email"`               // 访客邮箱（可选）
	VisitorWebsite string `json:"visitorWebsite"`                       // 访客网站（可选）
	Content        string `json:"content" v:"required|length:1,1000"`   // 评论内容
}

type CreateCommentRes struct {
	Id        int64  `json:"id"`
	CreatedAt string `json:"createdAt"`
}

type ListCommentsReq struct {
	g.Meta    `path:"/blog/comments" tags:"Blog" method:"get" summary:"List blog comments" noAuth:"true"`
	ArticleId int64  `json:"articleId" v:"required|min:1"`
	Page      int    `json:"page" d:"1"`
	Size      int    `json:"size" d:"20"`
	Status    string `json:"status" d:"approved"` // approved/pending/deleted
}

type CommentItem struct {
	Id             int64         `json:"id"`
	ArticleId      int64         `json:"articleId"`
	ParentId       *int64        `json:"parentId"`       // 父评论ID
	VisitorName    string        `json:"visitorName"`    // 访客昵称
	VisitorEmail   string        `json:"visitorEmail"`   // 访客邮箱
	VisitorWebsite string        `json:"visitorWebsite"` // 访客网站
	Content        string        `json:"content"`        // 评论内容
	HtmlContent    string        `json:"htmlContent"`    // HTML渲染内容
	Status         string        `json:"status"`         // 评论状态
	CreatedAt      time.Time     `json:"createdAt"`
	Replies        []CommentItem `json:"replies"` // 回复评论列表
}

type ListCommentsRes struct {
	Page  int           `json:"page"`
	Size  int           `json:"size"`
	Total int           `json:"total"`
	List  []CommentItem `json:"list"`
}

// 删除评论
type DeleteCommentReq struct {
	g.Meta `path:"/blog/comments" tags:"Blog" method:"delete" summary:"Delete a blog comment"`
	Id     int64 `json:"id" v:"required|min:1"`
}

type DeleteCommentRes struct {
	Deleted bool `json:"deleted"`
}

// IBlogV1 接口声明（用于 gf gen ctrl 生成控制器）
type IBlogV1 interface {
	// 文章管理
	Create(ctx g.Ctx, req *CreateReq) (res *CreateRes, err error)
	Update(ctx g.Ctx, req *UpdateReq) (res *UpdateRes, err error)
	List(ctx g.Ctx, req *ListReq) (res *ListRes, err error)
	Detail(ctx g.Ctx, req *DetailReq) (res *DetailRes, err error)
	Delete(ctx g.Ctx, req *DeleteReq) (res *DeleteRes, err error)

	// 分类管理
	CreateCategory(ctx g.Ctx, req *CreateCategoryReq) (res *CreateCategoryRes, err error)
	ListCategories(ctx g.Ctx, req *ListCategoriesReq) (res *ListCategoriesRes, err error)

	// 评论管理
	CreateComment(ctx g.Ctx, req *CreateCommentReq) (res *CreateCommentRes, err error)
	ListComments(ctx g.Ctx, req *ListCommentsReq) (res *ListCommentsRes, err error)
	DeleteComment(ctx g.Ctx, req *DeleteCommentReq) (res *DeleteCommentRes, err error)
}
