// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// FileContentsDao is the data access object for the table file_contents.
type FileContentsDao struct {
	table    string              // table is the underlying table name of the DAO.
	group    string              // group is the database configuration group name of the current DAO.
	columns  FileContentsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler  // handlers for customized model modification.
}

// FileContentsColumns defines and stores column names for the table file_contents.
type FileContentsColumns struct {
	Id               string // 主键ID
	FileContent      string // 文件二进制内容
	ThumbnailContent string // 缩略图二进制内容
	CreatedAt        string // 创建时间
	UpdatedAt        string // 更新时间
}

// fileContentsColumns holds the columns for the table file_contents.
var fileContentsColumns = FileContentsColumns{
	Id:               "id",
	FileContent:      "file_content",
	ThumbnailContent: "thumbnail_content",
	CreatedAt:        "created_at",
	UpdatedAt:        "updated_at",
}

// NewFileContentsDao creates and returns a new DAO object for table data access.
func NewFileContentsDao(handlers ...gdb.ModelHandler) *FileContentsDao {
	return &FileContentsDao{
		group:    "default",
		table:    "file_contents",
		columns:  fileContentsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *FileContentsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *FileContentsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *FileContentsDao) Columns() FileContentsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *FileContentsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *FileContentsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *FileContentsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
