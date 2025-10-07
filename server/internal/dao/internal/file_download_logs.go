// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// FileDownloadLogsDao is the data access object for the table file_download_logs.
type FileDownloadLogsDao struct {
	table    string                  // table is the underlying table name of the DAO.
	group    string                  // group is the database configuration group name of the current DAO.
	columns  FileDownloadLogsColumns // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler      // handlers for customized model modification.
}

// FileDownloadLogsColumns defines and stores column names for the table file_download_logs.
type FileDownloadLogsColumns struct {
	Id                string //
	FileId            string //
	FileUuid          string //
	DownloadIp        string //
	DownloadUserAgent string //
	DownloadReferer   string //
	DownloadSize      string //
	DownloadStatus    string //
	DownloadTime      string //
}

// fileDownloadLogsColumns holds the columns for the table file_download_logs.
var fileDownloadLogsColumns = FileDownloadLogsColumns{
	Id:                "id",
	FileId:            "file_id",
	FileUuid:          "file_uuid",
	DownloadIp:        "download_ip",
	DownloadUserAgent: "download_user_agent",
	DownloadReferer:   "download_referer",
	DownloadSize:      "download_size",
	DownloadStatus:    "download_status",
	DownloadTime:      "download_time",
}

// NewFileDownloadLogsDao creates and returns a new DAO object for table data access.
func NewFileDownloadLogsDao(handlers ...gdb.ModelHandler) *FileDownloadLogsDao {
	return &FileDownloadLogsDao{
		group:    "default",
		table:    "file_download_logs",
		columns:  fileDownloadLogsColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *FileDownloadLogsDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *FileDownloadLogsDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *FileDownloadLogsDao) Columns() FileDownloadLogsColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *FileDownloadLogsDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *FileDownloadLogsDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *FileDownloadLogsDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
