package service

import (
	"context"
	"time"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/os/gtime"
	"github.com/gogf/gf/v2/util/gconv"

	"server/internal/dao"
	"server/internal/model/entity"
	"server/internal/service/configcache"
)

// FileCleanupConfig 文件清理配置结构
type FileCleanupConfig struct {
	Enabled       bool // 是否启用清理
	RetentionDays int  // 保留天数
	IntervalHours int  // 执行间隔（小时）
	BatchSize     int  // 批处理大小
	LogEnabled    bool // 是否记录日志
}

// CleanupResult 清理结果
type CleanupResult struct {
	TotalProcessed int               `json:"total_processed"` // 总处理数量
	DeletedFiles   []DeletedFileInfo `json:"deleted_files"`   // 已删除的文件信息
	Errors         []string          `json:"errors"`          // 错误信息
	StartTime      time.Time         `json:"start_time"`      // 开始时间
	EndTime        time.Time         `json:"end_time"`        // 结束时间
	Duration       time.Duration     `json:"duration"`        // 执行时长
}

// DeletedFileInfo 已删除文件信息
type DeletedFileInfo struct {
	FileUUID     string    `json:"file_uuid"`
	FileName     string    `json:"file_name"`
	FileSize     int64     `json:"file_size"`
	FileCategory string    `json:"file_category"`
	DeletedAt    time.Time `json:"deleted_at"`
}

// IFileCleanup 文件清理服务接口
type IFileCleanup interface {
	// GetCleanupConfig 获取清理配置
	GetCleanupConfig(ctx context.Context) (*FileCleanupConfig, error)

	// PerformCleanup 执行文件清理
	PerformCleanup(ctx context.Context) (*CleanupResult, error)

	// GetFilesForCleanup 获取需要清理的文件列表
	GetFilesForCleanup(ctx context.Context, retentionDays int, limit int) ([]*entity.Files, error)

	// DeleteFilesPermanently 物理删除文件
	DeleteFilesPermanently(ctx context.Context, fileUUIDs []string) error

	// LogCleanupResult 记录清理结果
	LogCleanupResult(ctx context.Context, result *CleanupResult) error
}

type sFileCleanup struct{}

// FileCleanup 文件清理服务实例
func FileCleanup() IFileCleanup {
	return &sFileCleanup{}
}

// GetCleanupConfig 获取清理配置
func (s *sFileCleanup) GetCleanupConfig(ctx context.Context) (*FileCleanupConfig, error) {
	config := &FileCleanupConfig{
		Enabled:       false, // 默认禁用
		RetentionDays: 30,    // 默认30天
		IntervalHours: 24,    // 默认24小时
		BatchSize:     100,   // 默认100个
		LogEnabled:    true,  // 默认记录日志
	}

	// 从动态配置中读取设置
	configItems := []struct {
		key      string
		field    *bool
		intField *int
	}{
		{"file_cleanup_enabled", &config.Enabled, nil},
		{"file_cleanup_log_enabled", &config.LogEnabled, nil},
		{"file_cleanup_retention_days", nil, &config.RetentionDays},
		{"file_cleanup_interval_hours", nil, &config.IntervalHours},
		{"file_cleanup_batch_size", nil, &config.BatchSize},
	}

	for _, item := range configItems {
		if configItem, exists := configcache.Get(ctx, "system", "default", item.key); exists {
			if item.field != nil {
				if val, ok := configItem.Value.(bool); ok {
					*item.field = val
				}
			}
			if item.intField != nil {
				if val, ok := configItem.Value.(float64); ok {
					*item.intField = int(val)
				}
			}
		}
	}

	return config, nil
}

// PerformCleanup 执行文件清理
func (s *sFileCleanup) PerformCleanup(ctx context.Context) (*CleanupResult, error) {
	startTime := time.Now()
	result := &CleanupResult{
		StartTime:    startTime,
		DeletedFiles: make([]DeletedFileInfo, 0),
		Errors:       make([]string, 0),
	}

	// 获取清理配置
	config, err := s.GetCleanupConfig(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "获取清理配置失败")
	}

	// 检查是否启用清理
	if !config.Enabled {
		return result, gerror.New("文件清理功能未启用")
	}

	g.Log().Infof(ctx, "开始执行文件清理任务，保留天数: %d，批处理大小: %d", config.RetentionDays, config.BatchSize)

	// 获取需要清理的文件
	files, err := s.GetFilesForCleanup(ctx, config.RetentionDays, config.BatchSize)
	if err != nil {
		return nil, gerror.Wrap(err, "获取需要清理的文件失败")
	}

	if len(files) == 0 {
		g.Log().Infof(ctx, "没有需要清理的文件")
		result.EndTime = time.Now()
		result.Duration = result.EndTime.Sub(result.StartTime)
		return result, nil
	}

	g.Log().Infof(ctx, "找到 %d 个需要清理的文件", len(files))

	// 准备文件UUID列表
	fileUUIDs := make([]string, 0, len(files))
	deletedFiles := make([]DeletedFileInfo, 0, len(files))

	for _, file := range files {
		fileUUIDs = append(fileUUIDs, file.FileUuid)
		deletedFiles = append(deletedFiles, DeletedFileInfo{
			FileUUID:     file.FileUuid,
			FileName:     file.FileName,
			FileSize:     file.FileSize,
			FileCategory: file.FileCategory,
			DeletedAt:    time.Now(),
		})
	}

	// 物理删除文件
	err = s.DeleteFilesPermanently(ctx, fileUUIDs)
	if err != nil {
		return nil, gerror.Wrap(err, "物理删除文件失败")
	}

	// 构建结果
	result.TotalProcessed = len(files)
	result.DeletedFiles = deletedFiles
	result.EndTime = time.Now()
	result.Duration = result.EndTime.Sub(result.StartTime)

	// 记录清理日志
	if config.LogEnabled {
		if logErr := s.LogCleanupResult(ctx, result); logErr != nil {
			g.Log().Errorf(ctx, "记录清理日志失败: %v", logErr)
		}
	}

	g.Log().Infof(ctx, "文件清理完成，处理了 %d 个文件，耗时 %v", result.TotalProcessed, result.Duration)

	return result, nil
}

// GetFilesForCleanup 获取需要清理的文件列表
func (s *sFileCleanup) GetFilesForCleanup(ctx context.Context, retentionDays int, limit int) ([]*entity.Files, error) {
	// 计算截止时间
	cutoffTime := gtime.Now().AddDate(0, 0, -retentionDays)

	// 查询软删除超过保留天数的文件
	records, err := dao.Files.Ctx(ctx).
		Where("file_status", "deleted").
		Where("updated_at < ?", cutoffTime).
		Fields("file_uuid, file_name, file_size, file_category, updated_at").
		Order("updated_at ASC").
		Limit(limit).
		All()
	if err != nil {
		return nil, gerror.Wrap(err, "查询需要清理的文件失败")
	}

	var files []*entity.Files
	if err := records.Structs(&files); err != nil {
		return nil, gerror.Wrap(err, "解析文件列表失败")
	}

	return files, nil
}

// DeleteFilesPermanently 物理删除文件
func (s *sFileCleanup) DeleteFilesPermanently(ctx context.Context, fileUUIDs []string) error {
	if len(fileUUIDs) == 0 {
		return nil
	}

	// 开启事务进行物理删除
	return dao.Files.Transaction(ctx, func(ctx context.Context, tx gdb.TX) error {
		// 先删除相关的下载日志
		_, err := dao.FileDownloadLogs.Ctx(ctx).TX(tx).
			Where("file_uuid IN (?)", fileUUIDs).
			Delete()
		if err != nil {
			return gerror.Wrap(err, "删除下载日志失败")
		}

		// 物理删除文件记录
		_, err = dao.Files.Ctx(ctx).TX(tx).
			Where("file_uuid IN (?)", fileUUIDs).
			Delete()
		if err != nil {
			return gerror.Wrap(err, "物理删除文件记录失败")
		}

		g.Log().Infof(ctx, "成功物理删除 %d 个文件记录", len(fileUUIDs))
		return nil
	})
}

// LogCleanupResult 记录清理结果
func (s *sFileCleanup) LogCleanupResult(ctx context.Context, result *CleanupResult) error {
	// 记录清理日志到数据库或日志文件
	g.Log().Infof(ctx, "文件清理任务执行完成: 总处理数量=%d, 删除文件数=%d, 耗时=%v",
		result.TotalProcessed, len(result.DeletedFiles), result.Duration)

	// 记录被删除的文件详情
	for _, deletedFile := range result.DeletedFiles {
		g.Log().Infof(ctx, "已删除文件: UUID=%s, 名称=%s, 大小=%s, 分类=%s",
			deletedFile.FileUUID,
			deletedFile.FileName,
			gconv.String(deletedFile.FileSize),
			deletedFile.FileCategory)
	}

	// 如果有错误，记录错误信息
	if len(result.Errors) > 0 {
		g.Log().Errorf(ctx, "文件清理过程中发生错误: %v", result.Errors)
	}

	return nil
}

// StartCleanupScheduler 启动清理调度器（这是一个独立的后台任务）
func StartCleanupScheduler(ctx context.Context) {
	go func() {
		ticker := time.NewTicker(1 * time.Hour) // 每小时检查一次
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				g.Log().Info(ctx, "文件清理调度器已停止")
				return
			case <-ticker.C:
				scheduleCleanupIfNeeded(ctx)
			}
		}
	}()
}

// scheduleCleanupIfNeeded 根据配置决定是否执行清理
func scheduleCleanupIfNeeded(ctx context.Context) {
	cleanupService := FileCleanup()

	// 获取配置
	config, err := cleanupService.GetCleanupConfig(ctx)
	if err != nil {
		g.Log().Errorf(ctx, "获取清理配置失败: %v", err)
		return
	}

	// 如果未启用清理，直接返回
	if !config.Enabled {
		return
	}

	// 检查是否到了执行时间（简化版本，实际应该记录上次执行时间）
	// 这里我们简单地检查当前时间是否符合执行间隔
	now := time.Now()
	lastExecutionKey := "file_cleanup_last_execution"

	// 尝试从配置或缓存中获取上次执行时间
	if lastExecutionItem, exists := configcache.Get(ctx, "system", "default", lastExecutionKey); exists {
		if lastTimeStr, ok := lastExecutionItem.Value.(string); ok {
			if lastTime, err := time.Parse(time.RFC3339, lastTimeStr); err == nil {
				// 如果距离上次执行时间还没到配置的间隔，就不执行
				if now.Sub(lastTime) < time.Duration(config.IntervalHours)*time.Hour {
					return
				}
			}
		}
	}

	// 执行清理任务
	g.Log().Info(ctx, "开始执行定时文件清理任务")
	result, err := cleanupService.PerformCleanup(ctx)
	if err != nil {
		g.Log().Errorf(ctx, "定时文件清理任务执行失败: %v", err)
		return
	}

	// 记录执行结果
	g.Log().Infof(ctx, "定时文件清理任务执行完成: 处理了 %d 个文件", result.TotalProcessed)
}
