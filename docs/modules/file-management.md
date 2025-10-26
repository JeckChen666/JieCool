# 文件管理模块（File Management Module）

## 模块预期实现的目标

实现完整的文件存储和管理系统，支持多类型文件的上传、下载、预览和管理。通过SHA256哈希值实现文件去重和完整性校验，自动生成图片缩略图，提供软删除和恢复功能，确保数据安全性和系统性能。该模块适用于个人网站的文件资源管理场景，提供类似云盘的功能体验。

## 模块预期的功能点

### 1. 文件上传管理
- **文件上传**：支持多文件批量上传，自动文件类型检测和大小限制
- **完整性校验**：SHA256哈希值生成和验证，确保文件传输完整性
- **元数据提取**：自动提取文件名、扩展名、MIME类型、大小等基本信息
- **重复检测**：基于哈希值的文件去重机制，避免重复存储

### 2. 文件存储处理
- **二进制存储**：使用PostgreSQL BYTEA类型存储文件内容
- **缩略图生成**：针对图片文件自动生成压缩缩略图
- **分类管理**：按文件类型和扩展名进行自动分类
- **存储优化**：大文件分块存储，提升上传和下载性能

### 3. 文件访问控制
- **文件下载**：支持UUID标识的安全文件下载
- **权限验证**：基于UUID的访问控制，防止路径遍历攻击
- **访问统计**：记录下载次数、访问IP、User-Agent等信息
- **缓存策略**：缩略图和小文件缓存，提升访问速度

### 4. 文件管理功能
- **文件列表**：分页查询文件列表，支持多维度筛选和排序
- **文件搜索**：按文件名、类型、上传时间等条件搜索
- **软删除**：文件删除仅标记删除状态，不物理删除数据
- **恢复功能**：支持已删除文件的恢复操作

## 数据流向与处理逻辑

### 1. 文件上传流程
```
前端选择文件 → 文件类型验证 → 大小限制检查 → 上传到后端
                    ↓
生成SHA256哈希 → 检查重复文件 → 存储文件内容 → 提取元数据
                    ↓
是否为图片？ → 生成缩略图 → 保存文件记录 → 返回文件UUID
```

### 2. 文件下载流程
```
前端请求下载 → UUID验证 → 权限检查 → 查询文件记录
                    ↓
更新下载统计 → 读取文件内容 → 设置响应头 → 流式下载
```

### 3. 缩略图生成流程
```
文件上传完成 → 检测MIME类型 → 确认为图片 → 解码图片
                    ↓
尺寸调整 → 质量压缩 → 生成缩略图 → 存储缩略图内容
```

## 重点代码设计逻辑

### 1. 文件上传核心逻辑
```pseudocode
PROCEDURE UploadFile(fileData, metadata)
    TRY:
        步骤1: 验证文件类型和大小限制
        步骤2: 计算文件SHA256哈希值
        步骤3: 查询数据库检查重复文件
        IF 存在重复文件 THEN
            返回已存在文件的UUID
        ELSE
            步骤4: 将文件内容存入数据库BYTEA字段
            步骤5: 提取并存储文件元数据
            步骤6: 检查是否为图片文件
            IF 是图片 THEN
                调用GenerateThumbnail(fileData)
            END IF
            步骤7: 生成唯一UUID并返回
        END IF
    CATCH 文件过大异常:
        返回"文件大小超出限制"错误
    CATCH 文件类型异常:
        返回"不支持的文件类型"错误
    CATCH 存储异常:
        返回"文件存储失败"错误
    END PROCEDURE
```

### 2. 缩略图生成逻辑
```pseudocode
PROCEDURE GenerateThumbnail(fileContent)
    TRY:
        步骤1: 使用imaging库解码图片
        步骤2: 计算缩略图目标尺寸（最大宽度300px）
        步骤3: 保持宽高比调整图片尺寸
        步骤4: 压缩图片质量（JPEG质量85%）
        步骤5: 编码为JPEG格式
        步骤6: 存储缩略图到数据库
        步骤7: 更新文件的缩略图标识
    CATCH 图片解码异常:
        记录错误日志，不影响主文件存储
    CATCH 压缩异常:
        使用原图作为缩略图
    END PROCEDURE
```

### 3. 文件去重检查逻辑
```pseudocode
PROCEDURE CheckDuplicateFile(fileHash)
    步骤1: 查询files表WHERE file_hash = fileHash
    步骤2: IF 查询结果不为空 AND file_status != 'deleted' THEN
        返回已存在文件的file_uuid
    ELSE
        返回null（无重复文件）
    END IF
END PROCEDURE
```

### 4. 软删除逻辑
```pseudocode
PROCEDURE SoftDeleteFile(fileUuid)
    TRY:
        步骤1: 验证UUID格式和文件存在性
        步骤2: 更新file_status字段为'deleted'
        步骤3: 更新deleted_at时间戳
        步骤4: 返回删除成功状态
    CATCH 文件不存在异常:
        返回"文件不存在"错误
    CATCH 数据库异常:
        返回"删除操作失败"错误
    END PROCEDURE
```

## 模块功能使用方式

### 1. 前端界面集成
- **调用入口**：FileManagement组件作为主要管理界面
- **参数传递格式**：通过FormData对象传递文件和元数据
- **交互反馈机制**：上传进度条、成功/失败消息提示、文件列表实时更新

### 2. 后端接口调用
- **服务初始化方式**：通过GoFrame依赖注入自动初始化FileService
- **API签名示例**：
  ```go
  // 文件上传
  fileService.Upload(ctx, req *file.UploadReq) (*file.UploadRes, error)

  // 文件下载
  fileService.Download(ctx, fileUuid string) ([]byte, error)

  // 文件列表查询
  fileService.List(ctx, req *file.ListReq) (*file.ListRes, error)
  ```
- **异步处理约定**：大文件上传支持分块异步处理，返回Promise格式的响应

## 第三方组件与数据库设计

### 1. 第三方组件
| 组件名称 | 版本 | 在模块中的具体作用 |
|---------|------|------------------|
| GoFrame | v2.9.3 | Web框架，提供路由、中间件、ORM等功能 |
| PostgreSQL | 18 | 主数据库，存储文件内容和元数据 |
| disintegration/imaging | v1.6.2 | 图片处理库，用于生成缩略图 |
| Arco Design | 2.66.5 | 前端UI组件库，提供上传、表格等组件 |

### 2. 数据库设计
#### 主要表：files
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| file_uuid | UUID | UNIQUE NOT NULL | 文件唯一标识符 |
| file_name | TEXT | NOT NULL | 原始文件名 |
| file_extension | VARCHAR(20) | NOT NULL | 文件扩展名 |
| file_size | BIGINT | NOT NULL | 文件大小（字节） |
| mime_type | VARCHAR(255) | NOT NULL | MIME类型 |
| file_content | BYTEA | NOT NULL | 文件二进制内容 |
| file_hash | VARCHAR(64) | UNIQUE NOT NULL | SHA256哈希值 |
| has_thumbnail | BOOLEAN | DEFAULT false | 是否有缩略图 |
| thumbnail_content | BYTEA | | 缩略图二进制内容 |
| thumbnail_width | INTEGER | | 缩略图宽度 |
| thumbnail_height | INTEGER | | 缩略图高度 |
| download_count | BIGINT | DEFAULT 0 | 下载次数 |
| metadata | JSONB | | 扩展元数据 |
| file_status | VARCHAR(20) | DEFAULT 'active' | 文件状态 |
| file_category | VARCHAR(50) | | 文件分类 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMPTZ | | 删除时间（软删除） |

#### 辅助表：file_download_logs
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| file_id | BIGINT | REFERENCES files(id) | 关联文件ID |
| file_uuid | UUID | NOT NULL | 文件UUID |
| download_ip | INET | | 下载IP地址 |
| download_user_agent | TEXT | | 用户代理信息 |
| download_referer | TEXT | | 来源页面 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 下载时间 |

### 3. 索引设计
- `idx_files_file_hash`：文件哈希唯一索引，用于去重检查
- `idx_files_file_uuid`：文件UUID唯一索引，用于快速查找
- `idx_files_file_status`：文件状态索引，用于状态筛选
- `idx_files_created_at`：创建时间索引，用于时间排序
- `idx_files_deleted_at`：删除时间索引，用于软删除查询
- `idx_download_logs_file_uuid`：下载日志文件UUID索引