// ==========================================================================
// Code generated and maintained by GoFrame CLI tool. DO NOT EDIT.
// ==========================================================================

package internal

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/frame/g"
)

// FilesDao is the data access object for the table files.
type FilesDao struct {
	table    string             // table is the underlying table name of the DAO.
	group    string             // group is the database configuration group name of the current DAO.
	columns  FilesColumns       // columns contains all the column names of Table for convenient usage.
	handlers []gdb.ModelHandler // handlers for customized model modification.
}

// FilesColumns defines and stores column names for the table files.
type FilesColumns struct {
	Id                string //
	FileUuid          string //
	FileName          string //
	FileExtension     string //
	FileSize          string //
	MimeType          string //
	FileContent       string //
	FileHash          string //
	HasThumbnail      string //
	ThumbnailContent  string //
	ThumbnailWidth    string //
	ThumbnailHeight   string //
	DownloadCount     string //
	LastDownloadAt    string //
	Metadata          string //
	FileStatus        string //
	FileCategory      string //
	UploaderIp        string //
	UploaderUserAgent string //
	UploaderId        string //
	CreatedAt         string //
	UpdatedAt         string //
	FileMd5           string //
}

// filesColumns holds the columns for the table files.
var filesColumns = FilesColumns{
	Id:                "id",
	FileUuid:          "file_uuid",
	FileName:          "file_name",
	FileExtension:     "file_extension",
	FileSize:          "file_size",
	MimeType:          "mime_type",
	FileContent:       "file_content",
	FileHash:          "file_hash",
	HasThumbnail:      "has_thumbnail",
	ThumbnailContent:  "thumbnail_content",
	ThumbnailWidth:    "thumbnail_width",
	ThumbnailHeight:   "thumbnail_height",
	DownloadCount:     "download_count",
	LastDownloadAt:    "last_download_at",
	Metadata:          "metadata",
	FileStatus:        "file_status",
	FileCategory:      "file_category",
	UploaderIp:        "uploader_ip",
	UploaderUserAgent: "uploader_user_agent",
	UploaderId:        "uploader_id",
	CreatedAt:         "created_at",
	UpdatedAt:         "updated_at",
	FileMd5:           "file_md5",
}

// NewFilesDao creates and returns a new DAO object for table data access.
func NewFilesDao(handlers ...gdb.ModelHandler) *FilesDao {
	return &FilesDao{
		group:    "default",
		table:    "files",
		columns:  filesColumns,
		handlers: handlers,
	}
}

// DB retrieves and returns the underlying raw database management object of the current DAO.
func (dao *FilesDao) DB() gdb.DB {
	return g.DB(dao.group)
}

// Table returns the table name of the current DAO.
func (dao *FilesDao) Table() string {
	return dao.table
}

// Columns returns all column names of the current DAO.
func (dao *FilesDao) Columns() FilesColumns {
	return dao.columns
}

// Group returns the database configuration group name of the current DAO.
func (dao *FilesDao) Group() string {
	return dao.group
}

// Ctx creates and returns a Model for the current DAO. It automatically sets the context for the current operation.
func (dao *FilesDao) Ctx(ctx context.Context) *gdb.Model {
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
func (dao *FilesDao) Transaction(ctx context.Context, f func(ctx context.Context, tx gdb.TX) error) (err error) {
	return dao.Ctx(ctx).Transaction(ctx, f)
}
