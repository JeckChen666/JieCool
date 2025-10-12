// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// WeiboPostsDao is the data access object for the table weibo_posts.
type WeiboPostsDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  WeiboPostsColumns  // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// WeiboPostsColumns defines and stores column names for the table weibo_posts.
type WeiboPostsColumns struct {
	Id         string //
	Content    string //
	CreatedAt  string //
	UpdatedAt  string //
	AuthorId   string //
	Visibility string // public: 公开，private: 登录可见（权限预留）
	Lat        string //
	Lng        string //
	City       string //
	Device     string //
	Ip         string //
	IsDeleted  string //
	Extra      string //
}

// weiboPostsColumns holds the columns for the table weibo_posts.
var weiboPostsColumns = WeiboPostsColumns{
	Id:         "id",
	Content:    "content",
	CreatedAt:  "created_at",
	UpdatedAt:  "updated_at",
	AuthorId:   "author_id",
	Visibility: "visibility",
	Lat:        "lat",
	Lng:        "lng",
	City:       "city",
	Device:     "device",
	Ip:         "ip",
	IsDeleted:  "is_deleted",
	Extra:      "extra",
}

// NewWeiboPostsDao creates and returns a new DAO object for table data access.
func NewWeiboPostsDao(handlers ...gdb.ModelHandler) *WeiboPostsDao {
	return &WeiboPostsDao{
		group:    "default",
		table:    "weibo_posts",
		columns:  weiboPostsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *WeiboPostsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *WeiboPostsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *WeiboPostsDao) Columns() WeiboPostsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *WeiboPostsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *WeiboPostsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *WeiboPostsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
