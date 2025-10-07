// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// LogsVisitAccessDao is the data access object for the table logs_visit_access.
type LogsVisitAccessDao struct {
	table    string                 // table is the underlying table name of the DAO.
	group    string                 // group is the database configuration group name of the current DAO.
	columns  LogsVisitAccessColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler     // handlers for customized model modification.
}

// LogsVisitAccessColumns defines and stores column names for the table logs_visit_access.
type LogsVisitAccessColumns struct {
	Id        string //
	Time      string //
	Ip        string //
	UserAgent string //
	Method    string //
	Path      string //
	Headers   string //
	CreatedAt string //
}

// logsVisitAccessColumns holds the columns for the table logs_visit_access.
var logsVisitAccessColumns = LogsVisitAccessColumns{
	Id:        "id",
	Time:      "time",
	Ip:        "ip",
	UserAgent: "user_agent",
	Method:    "method",
	Path:      "path",
	Headers:   "headers",
	CreatedAt: "created_at",
}

// NewLogsVisitAccessDao creates and returns a new DAO object for table data access.
func NewLogsVisitAccessDao(handlers ...gdb.ModelHandler) *LogsVisitAccessDao {
	return &LogsVisitAccessDao{
		group:    "default",
		table:    "logs_visit_access",
		columns:  logsVisitAccessColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *LogsVisitAccessDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *LogsVisitAccessDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *LogsVisitAccessDao) Columns() LogsVisitAccessColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *LogsVisitAccessDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *LogsVisitAccessDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *LogsVisitAccessDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
