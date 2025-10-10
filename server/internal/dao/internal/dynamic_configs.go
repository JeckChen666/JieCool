// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// DynamicConfigsDao is the data access object for the table dynamic_configs.
type DynamicConfigsDao struct {
	table    string                // table is the underlying table name of the DAO.
	group    string                // group is the database configuration group name of the current DAO.
	columns  DynamicConfigsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler    // handlers for customized model modification.
}

// DynamicConfigsColumns defines and stores column names for the table dynamic_configs.
type DynamicConfigsColumns struct {
	Id          string //
	Namespace   string //
	Env         string //
	Key         string //
	Type        string //
	Value       string //
	Enabled     string //
	Version     string //
	Description string //
	UpdatedBy   string //
	UpdatedAt   string //
}

// dynamicConfigsColumns holds the columns for the table dynamic_configs.
var dynamicConfigsColumns = DynamicConfigsColumns{
	Id:          "id",
	Namespace:   "namespace",
	Env:         "env",
	Key:         "key",
	Type:        "type",
	Value:       "value",
	Enabled:     "enabled",
	Version:     "version",
	Description: "description",
	UpdatedBy:   "updated_by",
	UpdatedAt:   "updated_at",
}

// NewDynamicConfigsDao creates and returns a new DAO object for table data access.
func NewDynamicConfigsDao(handlers ...gdb.ModelHandler) *DynamicConfigsDao {
	return &DynamicConfigsDao{
		group:    "default",
		table:    "dynamic_configs",
		columns:  dynamicConfigsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *DynamicConfigsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *DynamicConfigsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *DynamicConfigsDao) Columns() DynamicConfigsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *DynamicConfigsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *DynamicConfigsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *DynamicConfigsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
