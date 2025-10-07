package file

import (
	"context"

	"github.com/gogf/gf/v2/database/gdb"
	"github.com/gogf/gf/v2/errors/gerror"

	"server/api/file/v1"
	"server/internal/service"
)

// GetFileStats 获取文件统计信息
func (c *ControllerV1) GetFileStats(ctx context.Context, req *v1.GetFileStatsReq) (res *v1.GetFileStatsRes, err error) {
	// 调用服务层获取文件统计信息
	stats, err := service.File().GetFileStats(ctx)
	if err != nil {
		return nil, gerror.Wrap(err, "获取文件统计信息失败")
	}

	// 安全的类型转换函数
	toInt64 := func(v interface{}) int64 {
		switch val := v.(type) {
		case int64:
			return val
		case int:
			return int64(val)
		case int32:
			return int64(val)
		default:
			return 0
		}
	}

	// 处理分类统计数据
	var categoryStats []v1.CategoryStats
	if categoryData, ok := stats["category_stats"]; ok && categoryData != nil {
		if categoryResult, ok := categoryData.(gdb.Result); ok {
			for _, record := range categoryResult {
				category := record["file_category"].String()
				if category == "" {
					category = "未分类"
				}
				categoryStats = append(categoryStats, v1.CategoryStats{
					Category: category,
					Count:    record["count"].Int64(),
					Size:     record["size"].Int64(),
				})
			}
		}
	}

	// 处理扩展名统计数据
	var extensionStats []v1.ExtensionStats
	if extensionData, ok := stats["extension_stats"]; ok && extensionData != nil {
		if extensionResult, ok := extensionData.(gdb.Result); ok {
			for _, record := range extensionResult {
				extension := record["file_extension"].String()
				if extension == "" {
					extension = "无扩展名"
				}
				extensionStats = append(extensionStats, v1.ExtensionStats{
					Extension: extension,
					Count:     record["count"].Int64(),
					Size:      record["size"].Int64(),
				})
			}
		}
	}

	// 处理大小分布数据（暂时为空，因为service层还没有实现）
	var sizeDistribution []v1.SizeDistribution

	return &v1.GetFileStatsRes{
		FileStats: v1.FileStats{
			TotalFiles:       toInt64(stats["total_files"]),
			TotalSize:        toInt64(stats["total_size"]),
			TotalDownloads:   toInt64(stats["total_downloads"]),
			CategoryStats:    categoryStats,
			ExtensionStats:   extensionStats,
			SizeDistribution: sizeDistribution,
		},
	}, nil
}
