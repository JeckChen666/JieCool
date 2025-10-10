// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// DynamicConfigVersionsDao is the data access object for the table dynamic_config_versions.
type DynamicConfigVersionsDao struct {
	table    string                       // table is the underlying table name of the DAO.
	group    string                       // group is the database configuration group name of the current DAO.
	columns  DynamicConfigVersionsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler           // handlers for customized model modification.
}

// DynamicConfigVersionsColumns defines and stores column names for the table dynamic_config_versions.
type DynamicConfigVersionsColumns struct {
	Id           string //
	Namespace    string //
	Env          string //
	Key          string //
	Version      string //
	Type         string //
	Value        string //
	Enabled      string //
	Description  string //
	ChangedBy    string //
	ChangeReason string //
	CreatedAt    string //
}

// dynamicConfigVersionsColumns holds the columns for the table dynamic_config_versions.
var dynamicConfigVersionsColumns = DynamicConfigVersionsColumns{
	Id:           "id",
	Namespace:    "namespace",
	Env:          "env",
	Key:          "key",
	Version:      "version",
	Type:         "type",
	Value:        "value",
	Enabled:      "enabled",
	Description:  "description",
	ChangedBy:    "changed_by",
	ChangeReason: "change_reason",
	CreatedAt:    "created_at",
}

// NewDynamicConfigVersionsDao creates and returns a new DAO object for table data access.
func NewDynamicConfigVersionsDao(handlers ...gdb.ModelHandler) *DynamicConfigVersionsDao {
	return &DynamicConfigVersionsDao{
		group:    "default",
		table:    "dynamic_config_versions",
		columns:  dynamicConfigVersionsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *DynamicConfigVersionsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *DynamicConfigVersionsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *DynamicConfigVersionsDao) Columns() DynamicConfigVersionsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *DynamicConfigVersionsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *DynamicConfigVersionsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *DynamicConfigVersionsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
