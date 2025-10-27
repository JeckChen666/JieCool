package file

import (
	"context"

	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/file/v1"
	"server/internal/service"
)

// CleanupFiles 清理已删除的文件
func (c *ControllerV1) CleanupFiles(ctx context.Context, req *v1.CleanupFilesReq) (res *v1.CleanupFilesRes, err error) {
	// 执行文件清理
	result, err := service.FileCleanup().PerformCleanup(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "执行文件清理失败")
	}

	// 构建响应
	return &v1.CleanupFilesRes{
		Success:        true,
		Message:        "文件清理任务执行完成",
		TotalProcessed: int64(result.TotalProcessed),
		DeletedCount:   int64(len(result.DeletedFiles)),
		Duration:       result.Duration.String(),
		StartTime:      result.StartTime.Format("2006-01-02 15:04:05"),
		EndTime:        result.EndTime.Format("2006-01-02 15:04:05"),
		DeletedFiles:   convertDeletedFiles(result.DeletedFiles),
		Errors:         result.Errors,
	}, nil
}

// GetCleanupStatus 获取清理状态和配置
func (c *ControllerV1) GetCleanupStatus(ctx context.Context, req *v1.GetCleanupStatusReq) (res *v1.GetCleanupStatusRes, err error) {
	// 获取清理配置
	config, err := service.FileCleanup().GetCleanupConfig(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "获取清理配置失败")
	}

	// 获取需要清理的文件数量
	filesToCleanup, err := service.FileCleanup().GetFilesForCleanup(ctx, config.RetentionDays, 1) // 只获取数量
	if err != nil {
		return nil, gerror.Wrap(err, "获取需要清理的文件数量失败")
	}

	return &v1.GetCleanupStatusRes{
		Enabled:        config.Enabled,
		RetentionDays:  config.RetentionDays,
		IntervalHours:  config.IntervalHours,
		BatchSize:      config.BatchSize,
		LogEnabled:     config.LogEnabled,
		PendingCleanup: len(filesToCleanup), // 实际可能更多，这里只做个估算
		ConfigMessage:  "配置已加载，可以手动触发清理任务",
	}, nil
}

// convertDeletedFiles 转换删除文件信息格式
func convertDeletedFiles(files []service.DeletedFileInfo) []v1.DeletedFileInfo {
	result := make([]v1.DeletedFileInfo, 0, len(files))
	for _, file := range files {
		result = append(result, v1.DeletedFileInfo{
			FileUUID:     file.FileUUID,
			FileName:     file.FileName,
			FileSize:     file.FileSize,
			FileCategory: file.FileCategory,
			DeletedAt:    file.DeletedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result
}
