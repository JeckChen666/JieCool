// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// WeiboAssetsDao is the data access object for the table weibo_assets.
type WeiboAssetsDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  WeiboAssetsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// WeiboAssetsColumns defines and stores column names for the table weibo_assets.
type WeiboAssetsColumns struct {
	Id        string //
	PostId    string //
	FileId    string // 引用文件系统中的文件主键/唯一ID（暂不设置外键，后续确认后可补充）
	Kind      string //
	SortOrder string //
	CreatedAt string //
}

// weiboAssetsColumns holds the columns for the table weibo_assets.
var weiboAssetsColumns = WeiboAssetsColumns{
	Id:        "id",
	PostId:    "post_id",
	FileId:    "file_id",
	Kind:      "kind",
	SortOrder: "sort_order",
	CreatedAt: "created_at",
}

// NewWeiboAssetsDao creates and returns a new DAO object for table data access.
func NewWeiboAssetsDao(handlers ...gdb.ModelHandler) *WeiboAssetsDao {
	return &WeiboAssetsDao{
		group:    "default",
		table:    "weibo_assets",
		columns:  weiboAssetsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *WeiboAssetsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *WeiboAssetsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *WeiboAssetsDao) Columns() WeiboAssetsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *WeiboAssetsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *WeiboAssetsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *WeiboAssetsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
