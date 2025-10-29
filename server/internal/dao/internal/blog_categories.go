// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// BlogCategoriesDao is the data access object for the table blog_categories.
type BlogCategoriesDao struct {
	table    string                // table is the underlying table name of the DAO.
	group    string                // group is the database configuration group name of the current DAO.
	columns  BlogCategoriesColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler    // handlers for customized model modification.
}

// BlogCategoriesColumns defines and stores column names for the table blog_categories.
type BlogCategoriesColumns struct {
	Id           string //
	CategoryId   string //
	Name         string //
	Slug         string //
	Description  string //
	ParentId     string //
	SortOrder    string //
	ArticleCount string //
	IsActive     string //
	CreatedAt    string //
	UpdatedAt    string //
}

// blogCategoriesColumns holds the columns for the table blog_categories.
var blogCategoriesColumns = BlogCategoriesColumns{
	Id:           "id",
	CategoryId:   "category_id",
	Name:         "name",
	Slug:         "slug",
	Description:  "description",
	ParentId:     "parent_id",
	SortOrder:    "sort_order",
	ArticleCount: "article_count",
	IsActive:     "is_active",
	CreatedAt:    "created_at",
	UpdatedAt:    "updated_at",
}

// NewBlogCategoriesDao creates and returns a new DAO object for table data access.
func NewBlogCategoriesDao(handlers ...gdb.ModelHandler) *BlogCategoriesDao {
	return &BlogCategoriesDao{
		group:    "default",
		table:    "blog_categories",
		columns:  blogCategoriesColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *BlogCategoriesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *BlogCategoriesDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *BlogCategoriesDao) Columns() BlogCategoriesColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *BlogCategoriesDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *BlogCategoriesDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *BlogCategoriesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
