// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// BlogArticlesDao is the data access object for the table blog_articles.
type BlogArticlesDao struct {
	table    string              // table is the underlying table name of the DAO.
	group    string              // group is the database configuration group name of the current DAO.
	columns  BlogArticlesColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler  // handlers for customized model modification.
}

// BlogArticlesColumns defines and stores column names for the table blog_articles.
type BlogArticlesColumns struct {
	Id            string //
	ArticleId     string //
	Title         string //
	Slug          string //
	Summary       string //
	Content       string //
	HtmlContent   string //
	AuthorId      string //
	CategoryId    string //
	Status        string //
	IsDraft       string //
	IsTop         string //
	IsPrivate     string //
	ViewCount     string //
	LikeCount     string //
	CommentCount  string //
	ShareCount    string //
	FeaturedImage string //
	ReadTime      string //
	PublishAt     string //
	CreatedAt     string //
	UpdatedAt     string //
	DeletedAt     string //
}

// blogArticlesColumns holds the columns for the table blog_articles.
var blogArticlesColumns = BlogArticlesColumns{
	Id:            "id",
	ArticleId:     "article_id",
	Title:         "title",
	Slug:          "slug",
	Summary:       "summary",
	Content:       "content",
	HtmlContent:   "html_content",
	AuthorId:      "author_id",
	CategoryId:    "category_id",
	Status:        "status",
	IsDraft:       "is_draft",
	IsTop:         "is_top",
	IsPrivate:     "is_private",
	ViewCount:     "view_count",
	LikeCount:     "like_count",
	CommentCount:  "comment_count",
	ShareCount:    "share_count",
	FeaturedImage: "featured_image",
	ReadTime:      "read_time",
	PublishAt:     "publish_at",
	CreatedAt:     "created_at",
	UpdatedAt:     "updated_at",
	DeletedAt:     "deleted_at",
}

// NewBlogArticlesDao creates and returns a new DAO object for table data access.
func NewBlogArticlesDao(handlers ...gdb.ModelHandler) *BlogArticlesDao {
	return &BlogArticlesDao{
		group:    "default",
		table:    "blog_articles",
		columns:  blogArticlesColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *BlogArticlesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *BlogArticlesDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *BlogArticlesDao) Columns() BlogArticlesColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *BlogArticlesDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *BlogArticlesDao) Ctx(ctx context.Context) *gdb.Model {
	model := dao.DB().Model(dao.table)
	for _, handler := range dao.handlers {
		model = handler(model)
	}
	return model.Safe().Ctx(ctx)
}

// Transaction wraps the transaction logic using function f.
// It rolls back the transaction and returns the error if function f returns a non-nil error.
// It commits the transaction and returns nil if function f returns nil.
//
// Note: Do not commit or roll back the transaction in function f,
// as it is automatically handled by this function.
func (dao *BlogArticlesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
