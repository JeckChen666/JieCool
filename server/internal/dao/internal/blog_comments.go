// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// BlogCommentsDao is the data access object for the table blog_comments.
type BlogCommentsDao struct {
	table    string              // table is the underlying table name of the DAO.
	group    string              // group is the database configuration group name of the current DAO.
	columns  BlogCommentsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler  // handlers for customized model modification.
}

// BlogCommentsColumns defines and stores column names for the table blog_comments.
type BlogCommentsColumns struct {
	Id             string //
	CommentId      string //
	ArticleId      string //
	ParentId       string //
	VisitorName    string //
	VisitorEmail   string //
	VisitorWebsite string //
	Content        string //
	HtmlContent    string //
	Status         string //
	IsDeleted      string //
	CreatedAt      string //
	UpdatedAt      string //
}

// blogCommentsColumns holds the columns for the table blog_comments.
var blogCommentsColumns = BlogCommentsColumns{
	Id:             "id",
	CommentId:      "comment_id",
	ArticleId:      "article_id",
	ParentId:       "parent_id",
	VisitorName:    "visitor_name",
	VisitorEmail:   "visitor_email",
	VisitorWebsite: "visitor_website",
	Content:        "content",
	HtmlContent:    "html_content",
	Status:         "status",
	IsDeleted:      "is_deleted",
	CreatedAt:      "created_at",
	UpdatedAt:      "updated_at",
}

// NewBlogCommentsDao creates and returns a new DAO object for table data access.
func NewBlogCommentsDao(handlers ...gdb.ModelHandler) *BlogCommentsDao {
	return &BlogCommentsDao{
		group:    "default",
		table:    "blog_comments",
		columns:  blogCommentsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *BlogCommentsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *BlogCommentsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *BlogCommentsDao) Columns() BlogCommentsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *BlogCommentsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *BlogCommentsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *BlogCommentsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
