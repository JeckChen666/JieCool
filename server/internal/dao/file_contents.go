package dao

import (
	"context"

	"server/internal/dao/internal"
	"server/internal/model/entity"
)

// FileContentsDao is the data access object for table file_contents.
type FileContentsDao struct {
	internal.FileContentsDao
	ctx context.Context
}

// NewFileContentsDao creates and returns a new DAO object for table data operations.
func NewFileContentsDao(ctx ...context.Context) *FileContentsDao {
	d := &FileContentsDao{}
	if len(ctx) > 0 {
		d.ctx = ctx[0]
	}
	d.FileContentsDao = *internal.NewFileContentsDao()
	return d
}

// CreateFileContent 创建文件内容记录
func (d *FileContentsDao) CreateFileContent(ctx context.Context, fileContent []byte, thumbnailContent []byte) (contentId int64, err error) {
	// 使用原生SQL解决PostgreSQL兼容性问题，明确指定时间戳字段
	sql := `
		INSERT INTO file_contents (file_content, thumbnail_content, created_at, updated_at)
		VALUES ($1, $2, NOW(), NOW())
		RETURNING id`

	result, err := d.DB().GetValue(ctx, sql, fileContent, thumbnailContent)
	if err != nil {
		return 0, err
	}
	return result.Int64(), nil
}

// GetFileContent 获取文件内容
func (d *FileContentsDao) GetFileContent(ctx context.Context, contentId int64) (*entity.FileContents, error) {
	var content *entity.FileContents
	err := d.Ctx(ctx).Where(d.Columns().Id, contentId).Scan(&content)
	return content, err
}

// DeleteFileContent 删除文件内容
func (d *FileContentsDao) DeleteFileContent(ctx context.Context, contentId int64) error {
	_, err := d.Ctx(ctx).Where(d.Columns().Id, contentId).Delete()
	return err
}
