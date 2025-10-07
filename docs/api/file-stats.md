# 文件统计 API 文档

## 接口概述

文件统计接口用于获取系统中文件的各种统计信息，包括总文件数、总大小、分类统计、扩展名统计等。

## 接口详情

### 获取文件统计信息

**接口路径**: `GET /file/stats`

**请求参数**: 无

**响应格式**:

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "total_files": 1,
    "total_size": 2354,
    "total_downloads": 0,
    "category_stats": [
      {
        "category": "general",
        "count": 1,
        "size": 2354
      }
    ],
    "extension_stats": [
      {
        "extension": "png",
        "count": 1,
        "size": 2354
      }
    ],
    "size_distribution": null
  }
}
```

**响应字段说明**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| total_files | int | 总文件数量 |
| total_size | int64 | 总文件大小（字节） |
| total_downloads | int | 总下载次数 |
| category_stats | array | 分类统计数组 |
| extension_stats | array | 扩展名统计数组 |
| size_distribution | array | 文件大小分布（暂未实现） |

**CategoryStats 结构**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| category | string | 文件分类名称 |
| count | int64 | 该分类的文件数量 |
| size | int64 | 该分类的总文件大小（字节） |

**ExtensionStats 结构**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| extension | string | 文件扩展名 |
| count | int64 | 该扩展名的文件数量 |
| size | int64 | 该扩展名的总文件大小（字节） |

## 更新历史

### 2025-01-27
- 修复了 ExtensionStats 结构中缺少 size 字段的问题
- 更新了后端查询逻辑，现在 extension_stats 包含每个扩展名的总文件大小
- 修复了前端显示 "NaN undefined" 的问题

## 注意事项

1. 所有文件大小以字节为单位
2. 扩展名统计按文件数量降序排列，最多返回前10个
3. 只统计状态为 "active" 的文件
4. 无扩展名的文件在 extension_stats 中显示为 "无扩展名"