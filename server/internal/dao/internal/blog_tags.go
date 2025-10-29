// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// BlogTagsDao is the data access object for the table blog_tags.
type BlogTagsDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  BlogTagsColumns    // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// BlogTagsColumns defines and stores column names for the table blog_tags.
type BlogTagsColumns struct {
	Id           string //
	TagId        string //
	Name         string //
	Slug         string //
	Description  string //
	Color        string //
	ArticleCount string //
	IsActive     string //
	CreatedAt    string //
	UpdatedAt    string //
}

// blogTagsColumns holds the columns for the table blog_tags.
var blogTagsColumns = BlogTagsColumns{
	Id:           "id",
	TagId:        "tag_id",
	Name:         "name",
	Slug:         "slug",
	Description:  "description",
	Color:        "color",
	ArticleCount: "article_count",
	IsActive:     "is_active",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
}

// NewBlogTagsDao creates and returns a new DAO object for table data access.
func NewBlogTagsDao(handlers ...gdb.ModelHandler) *BlogTagsDao {
	return &BlogTagsDao{
		group:    "default",
		table:    "blog_tags",
		columns:  blogTagsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *BlogTagsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *BlogTagsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *BlogTagsDao) Columns() BlogTagsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *BlogTagsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *BlogTagsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *BlogTagsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
