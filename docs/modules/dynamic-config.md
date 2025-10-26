# 动态配置模块（Dynamic Config Module）

## 模块预期实现的目标

实现运行时配置管理系统，支持配置项的动态创建、更新、删除和查询。通过进程内缓存机制提升配置读取性能，提供版本控制功能支持配置历史追溯和回滚。该模块支持多种数据类型存储和命名空间隔离，适用于系统参数管理、功能开关控制、业务规则配置等场景，实现无重启的配置热更新。

## 模块预期的功能点

### 1. 配置项管理
- **CRUD操作**：支持配置项的创建、读取、更新、删除完整生命周期管理
- **数据类型支持**：支持string、number、boolean、JSON等多种数据类型
- **命名空间隔离**：通过配置键的层级结构实现配置分组和权限隔离
- **配置验证**：支持配置值格式验证和业务规则校验

### 2. 缓存管理
- **进程内缓存**：配置数据加载到内存缓存，提升读取性能
- **缓存刷新**：支持手动和自动缓存刷新机制
- **缓存一致性**：保证多实例环境下的缓存数据一致性
- **缓存失效**：配置更新时自动失效相关缓存

### 3. 版本控制
- **历史版本**：自动记录配置变更历史，支持版本追溯
- **版本对比**：支持不同版本间配置差异对比
- **版本回滚**：支持回滚到指定历史版本
- **版本清理**：支持定期清理过期版本数据

### 4. 批量操作
- **批量导入**：支持配置项的批量导入功能
- **批量导出**：支持配置数据的批量导出
- **批量更新**：支持多个配置项的原子性批量更新
- **事务处理**：确保批量操作的事务性

## 数据流向与处理逻辑

### 1. 配置读取流程
```
前端请求配置 → 检查内存缓存 → 缓存命中？
                ↓(否)
查询数据库 → 解析配置值 → 类型转换 → 更新缓存
                ↓
返回配置数据 → 记录访问日志 → 定时刷新检查
```

### 2. 配置更新流程
```
前端提交更新 → 参数验证 → 权限检查 → 更新数据库
                ↓
创建版本记录 → 失效相关缓存 → 广播更新通知
                ↓
返回更新结果 → 记录操作日志 → 触发变更事件
```

### 3. 缓存刷新流程
```
触发刷新请求 → 重新加载配置 → 更新内存缓存
                ↓
验证配置完整性 → 更新最后刷新时间 → 返回刷新状态
```

## 重点代码设计逻辑

### 1. 配置读取核心逻辑
```pseudocode
PROCEDURE GetConfig(key, namespace)
    TRY:
        步骤1: 构建完整配置键（namespace.key）
        步骤2: 检查内存缓存是否存在
        IF 缓存存在 THEN
            返回缓存值
        ELSE
            步骤3: 查询数据库获取配置
            步骤4: 验证配置是否存在且有效
            IF 配置存在 THEN
                步骤5: 根据数据类型解析配置值
                步骤6: 更新内存缓存
                返回配置值
            ELSE
                返回默认值或抛出配置不存在异常
            END IF
        END IF
    CATCH 数据库异常:
        记录错误日志，尝试返回缓存值
    CATCH 类型转换异常:
        返回配置类型错误
    END PROCEDURE
```

### 2. 配置更新逻辑
```pseudocode
PROCEDURE UpdateConfig(key, value, type, namespace)
    TRY:
        步骤1: 验证配置键格式和权限
        步骤2: 验证配置值类型和格式
        步骤3: 开始数据库事务
        步骤4: 查询当前配置值
        步骤5: 创建版本历史记录
        步骤6: 更新主配置记录
        步骤7: 提交事务
        步骤8: 失效内存缓存
        步骤9: 发送配置变更通知
        返回更新成功状态
    CATCH 验证异常:
        回滚事务，返回参数验证错误
    CATCH 数据库异常:
        回滚事务，返回更新失败错误
    END PROCEDURE
```

### 3. 缓存管理逻辑
```pseudocode
PROCEDURE RefreshCache(namespace)
    TRY:
        步骤1: 查询指定命名空间的所有配置
        步骤2: 批量加载配置到内存缓存
        步骤3: 验证缓存完整性
        步骤4: 更新缓存刷新时间戳
        步骤5: 记录刷新操作日志
        返回刷新统计信息
    CATCH 数据库异常:
        记录错误日志，保持现有缓存
    CATCH 内存不足异常:
        清理部分缓存，重新加载
    END PROCEDURE
```

### 4. 版本管理逻辑
```pseudocode
PROCEDURE CreateVersion(configKey, oldValue, newValue, operator)
    步骤1: 生成版本号（基于时间戳）
    步骤2: 序列化新旧配置值
    步骤3: 记录操作上下文信息
    步骤4: 保存版本历史记录
    步骤5: 清理过期版本数据
END PROCEDURE

PROCEDURE RollbackVersion(configKey, targetVersion)
    TRY:
        步骤1: 验证目标版本存在性
        步骤2: 查询版本历史记录
        步骤3: 恢复配置到目标版本值
        步骤4: 创建回滚操作的新版本记录
        步骤5: 失效相关缓存
        返回回滚成功状态
    CATCH 版本不存在异常:
        返回版本不存在错误
    CATCH 数据库异常:
        返回回滚失败错误
    END PROCEDURE
```

### 5. 类型转换逻辑
```pseudocode
PROCEDURE ConvertConfigType(value, targetType)
    SWITCH targetType
        CASE "string":
            返回 String(value)
        CASE "number":
            IF isNumeric(value) THEN
                返回 Number(value)
            ELSE
                返回类型转换异常
        CASE "boolean":
            IF isBoolean(value) THEN
                返回 Boolean(value)
            ELSE
                返回类型转换异常
        CASE "json":
            IF isJSON(value) THEN
                返回 JSON.parse(value)
            ELSE
                返回类型转换异常
        DEFAULT:
            返回 String(value)
    END SWITCH
END PROCEDURE
```

## 模块功能使用方式

### 1. 前端界面集成
- **调用入口**：ConfigManagement组件作为主要管理界面
- **参数传递格式**：通过表单提交配置键、值、类型等信息
- **交互反馈机制**：实时验证提示、操作确认对话框、成功/失败消息通知

### 2. 后端接口调用
- **服务初始化方式**：通过GoFrame依赖注入自动初始化ConfigService
- **API签名示例**：
  ```go
  // 获取配置
  configService.Get(ctx, "app.name", "default")

  // 设置配置
  configService.Set(ctx, "app.name", "MyApp", "string")

  // 批量获取
  configService.GetBatch(ctx, []string{"app.name", "app.version"})

  // 刷新缓存
  configService.Refresh(ctx, "app")
  ```
- **异步处理约定**：返回Promise格式的响应，支持错误处理和重试机制

### 3. 缓存使用
```go
// 获取配置（自动缓存）
value := config.GetWithCache("database.host", "localhost")

// 强制刷新缓存
value := config.GetWithRefresh("database.host")

// 刷新指定命名空间缓存
config.RefreshNamespace("database")
```

## 第三方组件与数据库设计

### 1. 第三方组件
| 组件名称 | 版本 | 在模块中的具体作用 |
|---------|------|------------------|
| GoFrame | v2.9.3 | Web框架，提供缓存、数据库、配置管理等功能 |
| PostgreSQL | 18 | 主数据库，存储配置数据和版本历史 |
| Redis | 可选 | 分布式缓存，支持多实例环境 |
| Arco Design | 2.66.5 | 前端UI组件库，提供表单、表格等组件 |

### 2. 数据库设计
#### 主配置表：dynamic_configs
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| config_key | VARCHAR(255) | UNIQUE NOT NULL | 配置键名 |
| config_value | TEXT | | 配置值（JSON格式存储） |
| config_type | VARCHAR(20) | DEFAULT 'string' | 配置数据类型 |
| config_group | VARCHAR(100) | | 配置分组 |
| config_desc | TEXT | | 配置描述 |
| is_encrypted | BOOLEAN | DEFAULT false | 是否加密存储 |
| is_readonly | BOOLEAN | DEFAULT false | 是否只读 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |
| updated_by | VARCHAR(100) | | 更新者 |

#### 版本历史表：dynamic_config_versions
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| config_key | VARCHAR(255) | NOT NULL | 关联配置键名 |
| version | BIGINT | NOT NULL | 版本号 |
| old_value | TEXT | | 旧配置值 |
| new_value | TEXT | | 新配置值 |
| change_type | VARCHAR(20) | NOT NULL | 变更类型（create/update/delete） |
| change_desc | TEXT | | 变更描述 |
| operator | VARCHAR(100) | | 操作者 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 变更时间 |

#### 配置分组表：dynamic_config_groups
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| group_name | VARCHAR(100) | UNIQUE NOT NULL | 分组名称 |
| group_desc | TEXT | | 分组描述 |
| parent_id | BIGINT | | 父分组ID |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

### 3. 索引设计
- `idx_dynamic_configs_config_key`：配置键唯一索引
- `idx_dynamic_configs_config_group`：配置分组索引
- `idx_dynamic_configs_updated_at`：更新时间索引
- `idx_config_versions_config_key`：版本历史配置键索引
- `idx_config_versions_created_at`：版本创建时间索引

### 4. 内存缓存结构
```go
type ConfigCache struct {
    Data     map[string]interface{}  // 配置数据
    Groups   map[string][]string       // 分组索引
    Metadata map[string]CacheMetadata  // 缓存元数据
    LastSync time.Time                // 最后同步时间
}

type CacheMetadata struct {
    Key       string    // 配置键
    Type      string    // 数据类型
    Group     string    // 所属分组
    UpdatedAt time.Time // 更新时间
    TTL       time.Duration // 缓存过期时间
}
```

### 5. 配置值序列化
```go
// 配置值存储格式
type ConfigValue struct {
    Value     interface{} `json:"value"`     // 实际值
    Type      string      `json:"type"`      // 数据类型
    Encrypted bool        `json:"encrypted"` // 是否加密
    CreatedAt time.Time   `json:"createdAt"` // 创建时间
}
```

### 6. 事件通知结构
```go
type ConfigChangeEvent struct {
    Key      string      `json:"key"`      // 配置键
    OldValue interface{} `json:"oldValue"` // 旧值
    NewValue interface{} `json:"newValue"` // 新值
    Operator string      `json:"operator"` // 操作者
    Timestamp time.Time   `json:"timestamp"` // 变更时间
}
```