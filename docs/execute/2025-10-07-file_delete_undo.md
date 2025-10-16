# 文件删除和撤销删除功能执行文档

## 功能概述

本文档描述了文件管理系统中的软删除和撤销删除功能的设计逻辑、实现步骤、可能遇到的问题及解决方案。

## 设计逻辑

### 软删除机制
- **设计原则**: 采用软删除而非物理删除，确保数据安全和可恢复性
- **状态管理**: 通过`file_status`字段管理文件状态（active/deleted/archived）
- **数据保留**: 删除的文件内容和元数据完全保留在数据库中
- **用户体验**: 提供30秒撤销窗口，增强用户操作的容错性

### 撤销删除机制
- **时间窗口**: 前端提供30秒的撤销时间窗口
- **状态恢复**: 将文件状态从`deleted`恢复为`active`
- **通知系统**: 使用Ant Design的Notification组件显示撤销选项
- **自动清理**: 30秒后自动清理撤销数据和通知

## 实现步骤

### 1. 数据库设计

#### 文件表结构
```sql
CREATE TABLE files (
    file_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_content BYTEA,
    file_hash VARCHAR(64),
    file_status VARCHAR(20) DEFAULT 'active' CHECK (file_status IN ('active', 'deleted', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 关键字段说明
- `file_status`: 文件状态字段，支持三种状态
  - `active`: 正常状态
  - `deleted`: 软删除状态
  - `archived`: 归档状态

### 2. 后端实现

#### 2.1 API接口定义
```go
// 删除文件接口
type DeleteFileReq struct {
    FileUuid string `json:"file_uuid" v:"required|uuid" dc:"文件UUID"`
}

type DeleteFileRes struct{}

// 恢复文件接口
type RestoreFileReq struct {
    FileUuid string `json:"file_uuid" v:"required|uuid" dc:"文件UUID"`
}

type RestoreFileRes struct{}
```

#### 2.2 控制器实现
- **删除控制器**: 调用服务层的DeleteFile方法
- **恢复控制器**: 调用服务层的RestoreFile方法
- **错误处理**: 统一的错误响应格式

#### 2.3 服务层实现
```go
// 软删除文件
func (s *sFile) DeleteFile(ctx context.Context, fileUuid string) error {
    // 检查文件是否存在且状态为active
    // 更新file_status为deleted
    // 记录操作日志
}

// 恢复文件
func (s *sFile) RestoreFile(ctx context.Context, fileUuid string) error {
    // 检查文件是否存在且状态为deleted
    // 更新file_status为active
    // 记录操作日志
}
```

### 3. 前端实现

#### 3.1 API客户端
```typescript
// 文件API客户端
export const fileApi = {
  deleteFile: (fileUuid: string) => 
    request.delete(`/file/delete/${fileUuid}`),
  
  restoreFile: (fileUuid: string) => 
    request.post(`/file/restore/${fileUuid}`)
};
```

#### 3.2 删除功能实现
```typescript
const handleDelete = async (fileUuid: string, fileName: string) => {
  try {
    // 执行删除操作
    await fileApi.deleteFile(fileUuid);
    
    // 设置撤销数据
    setUndoDeleteData({ fileUuid, fileName });
    
    // 显示撤销通知
    notification.info({
      message: '文件已删除',
      description: `文件 "${fileName}" 已删除，30秒内可撤销`,
      duration: 30,
      btn: (
        <Button type="primary" size="small" onClick={handleUndoDelete}>
          撤销删除
        </Button>
      ),
      onClose: clearUndoDeleteData
    });
    
    // 30秒后自动清理
    setTimeout(clearUndoDeleteData, 30000);
    
    // 刷新文件列表
    refreshFileList();
  } catch (error) {
    message.error('删除失败');
  }
};
```

#### 3.3 撤销删除功能实现
```typescript
const handleUndoDelete = async () => {
  if (!undoDeleteData) return;
  
  try {
    // 执行恢复操作
    await fileApi.restoreFile(undoDeleteData.fileUuid);
    
    // 显示成功消息
    message.success(`文件 "${undoDeleteData.fileName}" 已恢复`);
    
    // 清理撤销数据
    clearUndoDeleteData();
    
    // 刷新文件列表
    refreshFileList();
    
    // 关闭通知
    notification.destroy();
  } catch (error) {
    message.error('恢复失败');
  }
};
```

## 可能遇到的问题及解决方案

### 1. 数据库相关问题

#### 问题1: 文件状态约束违反
**现象**: 尝试设置不支持的文件状态值
**解决方案**: 
- 在数据库层面添加CHECK约束
- 在应用层面进行状态验证
- 使用枚举类型确保类型安全

#### 问题2: 并发操作冲突
**现象**: 多个用户同时操作同一文件导致状态不一致
**解决方案**:
- 使用数据库事务确保操作原子性
- 添加乐观锁机制
- 在前端添加操作状态检查

### 2. 前端相关问题

#### 问题1: 通知组件重复显示
**现象**: 快速删除多个文件时通知堆叠
**解决方案**:
- 使用notification.destroy()清理之前的通知
- 限制同时显示的通知数量
- 合并相似的通知消息

#### 问题2: 撤销数据状态管理
**现象**: 页面刷新后撤销数据丢失
**解决方案**:
- 使用sessionStorage临时存储撤销数据
- 页面加载时检查并恢复撤销状态
- 设置合理的过期时间

### 3. 用户体验问题

#### 问题1: 撤销时间窗口过短
**现象**: 用户反馈30秒时间不够
**解决方案**:
- 根据用户反馈调整时间窗口
- 提供配置选项允许用户自定义
- 在通知中显示剩余时间

#### 问题2: 批量操作的撤销处理
**现象**: 批量删除后无法单独撤销某个文件
**解决方案**:
- 为每个删除的文件单独显示撤销选项
- 提供批量撤销功能
- 优化通知显示方式避免界面混乱

## 测试要点

### 1. 功能测试
- [ ] 单个文件删除和恢复
- [ ] 批量文件删除和恢复
- [ ] 撤销时间窗口验证
- [ ] 通知显示和关闭
- [ ] 文件列表刷新

### 2. 边界测试
- [ ] 删除不存在的文件
- [ ] 恢复未删除的文件
- [ ] 重复删除同一文件
- [ ] 重复恢复同一文件
- [ ] 网络异常情况处理

### 3. 性能测试
- [ ] 大量文件删除性能
- [ ] 数据库查询性能
- [ ] 前端渲染性能
- [ ] 内存使用情况

## 部署注意事项

### 1. 数据库迁移
- 确保`file_status`字段的CHECK约束正确设置
- 为现有数据设置默认状态值
- 添加必要的索引优化查询性能

### 2. 配置项
- 撤销时间窗口配置
- 通知显示配置
- 日志记录级别配置

### 3. 监控指标
- 删除操作成功率
- 撤销操作使用率
- 响应时间监控
- 错误率统计

## 后续优化方向

1. **增强撤销功能**
   - 支持撤销时间窗口配置
   - 添加撤销历史记录
   - 支持管理员强制恢复

2. **性能优化**
   - 实现软删除文件的定期清理
   - 优化大量文件的批量操作
   - 添加缓存机制

3. **用户体验提升**
   - 添加删除确认对话框
   - 支持键盘快捷键操作
   - 优化移动端体验