# 文件统计显示问题修复

## 问题描述

在文件管理系统的统计信息页面中，文件类型统计部分显示 "NaN undefined"，影响用户体验。

## 问题分析

### 前端问题
1. 前端 `FileStats.tsx` 组件中使用了 `IconBarChart` 图标，但该图标在 `@arco-design/web-react/icon` 中不存在
2. `useRequest` 的 `initialData` 结构与 `FileStats` 类型不匹配

### 后端问题
1. API 接口 `/file/stats` 返回的 `extension_stats` 数据结构缺少 `size` 字段
2. 后端 `ExtensionStats` 结构定义中没有 `Size` 字段
3. Service 层查询逻辑没有计算每个扩展名的总文件大小

## 解决方案

### 1. 修复前端图标问题
- 将 `IconBarChart` 替换为 `IconDashboard`
- 更新 `FileStats.tsx` 中的图标导入和使用

### 2. 修复前端数据结构问题
- 更新 `useRequest` 的 `initialData`，添加所有必需字段
- 确保初始数据结构与 `FileStats` 类型匹配

### 3. 修复后端数据结构问题
- 在 `api/file/v1/file.go` 中为 `ExtensionStats` 结构添加 `Size` 字段
- 更新 Service 层查询逻辑，添加 `SUM(file_size) as size`
- 更新 Controller 层处理逻辑，将 `size` 字段包含在响应中

## 实施步骤

### 前端修复
1. 修复图标导入问题
   ```typescript
   // 修改前
   import { IconBarChart } from '@arco-design/web-react/icon';
   
   // 修改后
   import { IconDashboard } from '@arco-design/web-react/icon';
   ```

2. 修复初始数据结构
   ```typescript
   const initialData: FileStats = {
     total_files: 0,
     total_size: 0,
     total_downloads: 0,
     category_stats: [],
     extension_stats: [],
     size_distribution: [],
     daily_upload_stats: []
   };
   ```

### 后端修复
1. 更新 API 结构定义
   ```go
   type ExtensionStats struct {
     Extension string `json:"extension" dc:"文件扩展名"`
     Count     int64  `json:"count" dc:"文件数量"`
     Size      int64  `json:"size" dc:"总文件大小"`
   }
   ```

2. 更新 Service 层查询
   ```go
   extensionStats, err := dao.Files.Ctx(ctx).
     Where("file_status", "active").
     Fields("file_extension, COUNT(*) as count, SUM(file_size) as size").
     Group("file_extension").
     Order("count DESC").
     Limit(10).
     All()
   ```

3. 更新 Controller 层处理
   ```go
   extensionStats = append(extensionStats, v1.ExtensionStats{
     Extension: extension,
     Count:     record["count"].Int64(),
     Size:      record["size"].Int64(),
   })
   ```

## 测试验证

1. 重启后端服务
2. 访问文件管理页面的统计信息标签
3. 验证文件类型统计正确显示文件大小
4. 确认不再出现 "NaN undefined" 问题

## 结果

修复后，统计信息页面正常显示：
- 总文件数：1 个
- 总存储大小：2.3 KB
- 文件类型统计：png - 1 个文件，2.3 KB

API 响应数据结构正确：
```json
{
  "extension_stats": [
    {
      "extension": "png",
      "count": 1,
      "size": 2354
    }
  ]
}
```

## 注意事项

1. 确保前后端数据结构保持一致
2. 在修改 API 结构时，需要同时更新前端类型定义
3. 图标使用时需要确认在组件库中是否存在
4. 数据库查询时注意字段的聚合计算

## 相关文件

### 前端文件
- `front-web/src/components/FileStats.tsx`

### 后端文件
- `server/api/file/v1/file.go`
- `server/internal/service/file.go`
- `server/internal/controller/file/file_v1_get_file_stats.go`