# 配置管理 API 文档

## 概述

配置管理模块提供动态配置的创建、更新、删除、查询和版本管理功能。所有API请求都通过alova库自动处理认证，无需手动添加token。

## API 列表

### 1. 获取配置列表

获取指定命名空间和环境的配置列表。

**请求方法：** GET  
**API路径：** `config/list`  
**请求参数：**
```typescript
{
  namespace?: string;  // 命名空间，可选
  env?: string;        // 环境，可选
}
```

**响应数据：**
```typescript
ConfigItem[]  // 配置项数组
```

**配置项类型定义：**
```typescript
interface ConfigItem {
  id: string;
  key: string;
  value: string;
  description?: string;
  namespace: string;
  environment: string;
  version: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}
```

### 2. 获取配置版本历史

获取指定配置的版本历史记录。

**请求方法：** GET  
**API路径：** `config/versions/{key}`  
**请求参数：**
```typescript
{
  namespace: string;    // 命名空间
  environment: string;  // 环境
}
```

**响应数据：**
```typescript
ConfigVersion[]  // 版本历史数组
```

**版本历史类型定义：**
```typescript
interface ConfigVersion {
  id: string;
  config_id: string;
  version: number;
  value: string;
  description?: string;
  created_at: string;
  created_by?: string;
  change_reason?: string;
}
```

### 3. 创建配置

创建新的配置项。

**请求方法：** POST  
**API路径：** `config/create`  
**请求参数：**
```typescript
interface ConfigCreateRequest {
  key: string;
  value: string;
  description?: string;
  namespace: string;
  environment: string;
}
```

**响应数据：**
```typescript
ConfigItem  // 创建的配置项
```

### 4. 更新配置

更新现有配置的值和描述。

**请求方法：** PUT  
**API路径：** `config/update/{key}`  
**请求参数：**
```typescript
// URL参数
{
  namespace: string;    // 命名空间
  environment: string;  // 环境
}

// 请求体
interface ConfigUpdateRequest {
  value: string;
  description?: string;
}
```

**响应数据：**
```typescript
ConfigItem  // 更新后的配置项
```

### 5. 删除配置

删除指定的配置项。

**请求方法：** DELETE  
**API路径：** `config/delete`  
**请求参数：**
```typescript
interface ConfigDeleteRequest {
  key: string;
  namespace: string;
  environment: string;
}
```

**响应数据：**
```typescript
void  // 无返回内容
```

### 6. 回滚配置

将配置回滚到指定版本。

**请求方法：** POST  
**API路径：** `config/rollback`  
**请求参数：**
```typescript
interface ConfigRollbackRequest {
  key: string;
  namespace: string;
  environment: string;
  version: number;
}
```

**响应数据：**
```typescript
ConfigItem  // 回滚后的配置项
```

### 7. 获取缓存统计

获取配置缓存的统计信息。

**请求方法：** GET  
**API路径：** `config/stats`  
**请求参数：** 无

**响应数据：**
```typescript
interface ConfigStatsResponse {
  entries: number;
  lastUpdated: string;
  namespaces: string[];
  environments: string[];
}
```

### 8. 刷新缓存

刷新配置缓存，可选择指定命名空间、环境或特定键。

**请求方法：** POST  
**API路径：** `config/refresh`  
**请求参数：**
```typescript
interface ConfigRefreshParams {
  namespace?: string;  // 命名空间，可选
  env?: string;        // 环境，可选
  keys?: string[];     // 特定键列表，可选
}
```

**响应数据：**
```typescript
interface ConfigRefreshResponse {
  success: boolean;
  message: string;
  refreshedCount?: number;
}
```

## 前端使用示例

```typescript
import { configApi } from '@/lib/config-api';

// 获取配置列表
const configs = await configApi.list({ namespace: 'app', env: 'prod' });

// 获取版本历史
const versions = await configApi.versions('app.title', 'app', 'prod');

// 创建配置
const newConfig = await configApi.create({
  key: 'app.title',
  value: 'My Application',
  description: '应用程序标题',
  namespace: 'app',
  environment: 'prod'
});

// 更新配置
const updatedConfig = await configApi.update('app.title', {
  value: 'Updated Application Title',
  description: '更新后的应用程序标题'
}, 'app', 'prod');

// 删除配置
await configApi.delete({
  key: 'app.title',
  namespace: 'app',
  environment: 'prod'
});

// 回滚配置
const rolledBackConfig = await configApi.rollback({
  key: 'app.title',
  namespace: 'app',
  environment: 'prod',
  version: 2
});

// 获取缓存统计
const stats = await configApi.stats();

// 刷新缓存
const refreshResult = await configApi.refresh({
  namespace: 'app',
  env: 'prod'
});
```

## 权限要求

所有配置管理API都需要用户已登录并具有相应的权限。alova会自动处理认证，无需手动添加token。