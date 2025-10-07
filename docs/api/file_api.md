# 文件管理 API 文档

## 概述
文件管理API提供文件上传、下载、列表查询、MD5校验等功能，支持文件完整性验证。

## 文件完整性保障
本系统实现了完整的文件完整性验证机制：

### MD5验证机制
- **上传时验证**: 文件上传后自动计算MD5值并存储到数据库
- **下载时验证**: 下载文件前验证存储的MD5与实际文件内容的MD5是否一致
- **完整性保障**: 如果MD5不匹配，下载请求将被拒绝并返回错误信息

### 数据存储优化
- **二进制存储**: 文件内容以PostgreSQL的`bytea`类型存储，确保二进制数据完整性
- **原生SQL存储**: 使用原生SQL语句替代ORM，避免`[]byte`数据在ORM层被错误转换为字符串
- **直接读取**: 避免通过ORM实体的字符串转换，直接从数据库读取二进制数据
- **防止损坏**: 消除了数据类型转换过程中可能导致的文件损坏问题

### 修复历史
- **2025-01-27**: 修复了二进制文件上传时数据损坏的问题
  - **问题**: GoFrame ORM将`[]byte`数据错误转换为字符串，导致不可打印字符损坏
  - **解决方案**: 在文件存储时使用原生SQL的`INSERT`语句，确保二进制数据正确传递
  - **影响**: 修复后所有类型文件（文本、图片、二进制）的MD5验证均正常

## 基础配置
- **API基础地址**: `http://localhost:8080`
- **内容类型**: `application/json` 或 `multipart/form-data`（上传时）
- **字符编码**: `UTF-8`

## 接口列表

### 1. 文件上传

#### 接口信息
- **路径**: `/file/upload`
- **方法**: `POST`
- **描述**: 上传文件到服务器
- **内容类型**: `multipart/form-data`

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file | file | 是 | 要上传的文件 |

#### 响应格式
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "file_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "file_name": "example.txt",
    "file_size": 1024,
    "mime_type": "text/plain",
    "file_md5": "5d41402abc4b2a76b9719d911017c592",
    "upload_time": "2024-01-01T12:00:00Z"
  }
}
```

#### 响应字段说明
| 字段名 | 类型 | 描述 |
|--------|------|------|
| file_uuid | string | 文件唯一标识符 |
| file_name | string | 原始文件名 |
| file_size | number | 文件大小（字节） |
| mime_type | string | 文件MIME类型 |
| file_md5 | string | 文件MD5值，用于完整性验证 |
| upload_time | string | 上传时间（ISO 8601格式） |

### 2. 获取文件列表

#### 接口信息
- **路径**: `/file/list`
- **方法**: `GET`
- **描述**: 获取文件列表，包含MD5信息

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| page | number | 否 | 页码，默认1 |
| page_size | number | 否 | 每页数量，默认10 |

#### 响应格式
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "list": [
      {
        "file_uuid": "550e8400-e29b-41d4-a716-446655440000",
        "file_name": "example.txt",
        "file_size": 1024,
        "mime_type": "text/plain",
        "file_md5": "5d41402abc4b2a76b9719d911017c592",
        "upload_time": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 10
  }
}
```

### 3. 文件下载

#### 接口信息
- **路径**: `/file/download/{file_uuid}`
- **方法**: `GET`
- **描述**: 下载指定文件，包含完整性验证

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file_uuid | string | 是 | 文件UUID（路径参数） |

#### 完整性验证
下载时系统会自动进行MD5完整性验证：
1. 读取文件内容并计算实时MD5值
2. 与数据库存储的MD5值进行比较
3. 如果MD5不匹配，返回错误信息并拒绝下载
4. 只有验证通过的文件才会被下载

#### 响应格式
- **成功**: 返回文件二进制流，包含以下响应头：
  - `Content-Type`: 文件MIME类型
  - `Content-Length`: 文件大小
  - `Content-Disposition`: 文件名信息
  - `ETag`: 文件哈希值（用于缓存）
  - `Cache-Control`: 缓存控制
  - `Last-Modified`: 最后修改时间

- **完整性验证失败**: 返回JSON错误信息
```json
{
  "code": 50,
  "message": "文件完整性验证失败，文件可能已损坏",
  "data": null
}
```

- **其他错误**: 返回相应的JSON错误信息

### 4. 获取文件信息

#### 接口信息
- **路径**: `/file/info/{file_uuid}`
- **方法**: `GET`
- **描述**: 获取指定文件的详细信息，包含MD5哈希值、文件状态等完整信息

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file_uuid | string | 是 | 文件UUID（路径参数） |

#### 响应格式
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 1,
    "file_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "file_name": "example.txt",
    "file_extension": "txt",
    "file_size": 1024,
    "mime_type": "text/plain",
    "file_category": "general",
    "file_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "file_md5": "5d41402abc4b2a76b9719d911017c592",
    "has_thumbnail": false,
    "download_count": 5,
    "last_download_at": "2024-01-01T12:00:00Z",
    "file_status": "active",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "download_url": "/file/download/550e8400-e29b-41d4-a716-446655440000",
    "thumbnail_url": null
  }
}
```

#### 响应字段说明
| 字段名 | 类型 | 描述 |
|--------|------|------|
| id | number | 文件ID |
| file_uuid | string | 文件唯一标识符 |
| file_name | string | 文件名 |
| file_extension | string | 文件扩展名 |
| file_size | number | 文件大小（字节） |
| mime_type | string | MIME类型 |
| file_category | string | 文件分类 |
| file_hash | string | 文件SHA256哈希值 |
| file_md5 | string | 文件MD5哈希值（32位十六进制字符串） |
| has_thumbnail | boolean | 是否有缩略图 |
| download_count | number | 下载次数 |
| last_download_at | string | 最近一次下载时间 |
| file_status | string | 文件状态（active/deleted） |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |
| download_url | string | 下载链接 |
| thumbnail_url | string | 缩略图链接 |

### 5. 获取文件MD5

#### 接口信息
- **路径**: `/file/md5/{file_uuid}`
- **方法**: `GET`
- **描述**: 获取指定文件的MD5哈希值，用于文件完整性验证

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file_uuid | string | 是 | 文件UUID（路径参数） |

#### 响应格式
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "file_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "file_name": "example.txt",
    "file_md5": "5d41402abc4b2a76b9719d911017c592",
    "file_size": 1024
  }
}
```

#### 响应字段说明
| 字段名 | 类型 | 描述 |
|--------|------|------|
| file_uuid | string | 文件唯一标识 |
| file_name | string | 文件名 |
| file_md5 | string | 文件MD5哈希值（32位十六进制字符串） |
| file_size | number | 文件大小（字节） |

### 6. 获取文件统计

#### 接口信息
- **路径**: `/file/stats`
- **方法**: `GET`
- **描述**: 获取文件系统的统计信息，包括总文件数、大小分布、分类统计等

#### 响应格式
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "total_files": 150,
    "total_size": 1073741824,
    "total_downloads": 500,
    "category_stats": [
      {
        "category": "image",
        "count": 50,
        "size": 536870912
      },
      {
        "category": "document",
        "count": 30,
        "size": 268435456
      }
    ],
    "extension_stats": [
      {
        "extension": "jpg",
        "count": 25,
        "size": 268435456
      },
      {
        "extension": "pdf",
        "count": 15,
        "size": 134217728
      }
    ],
    "size_distribution": [
      {
        "range": "0-1MB",
        "count": 80
      },
      {
        "range": "1-10MB",
        "count": 50
      },
      {
        "range": "10MB+",
        "count": 20
      }
    ]
  }
}
```

### 7. 获取文件缩略图

#### 接口信息
- **路径**: `/file/thumbnail/{file_uuid}`
- **方法**: `GET`
- **描述**: 获取指定文件的缩略图（仅支持图片文件）

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file_uuid | string | 是 | 文件UUID（路径参数） |
| width | number | 否 | 缩略图宽度，默认200 |
| height | number | 否 | 缩略图高度，默认200 |

#### 响应格式
- **成功**: 返回图片二进制流，包含以下响应头：
  - `Content-Type`: image/jpeg 或 image/png
  - `Content-Length`: 图片大小
  - `Cache-Control`: 缓存控制
  - `ETag`: 图片哈希值

- **错误**: 返回JSON错误信息
```json
{
  "code": 404,
  "message": "缩略图不存在或文件不支持缩略图",
  "data": null
}
```

### 8. 文件删除

#### 接口信息
- **路径**: `/file/delete/{file_uuid}`
- **方法**: `DELETE`
- **描述**: 软删除指定文件（文件状态变更为deleted，支持撤销恢复）

#### 软删除机制
- **软删除**: 文件不会被物理删除，而是将`file_status`字段更新为`deleted`
- **数据保留**: 文件内容和元数据完全保留在数据库中
- **撤销支持**: 删除后可通过恢复接口撤销删除操作
- **前端集成**: 前端会显示30秒撤销删除通知，用户可在此期间恢复文件

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file_uuid | string | 是 | 文件UUID（路径参数） |

#### 响应格式
```json
{
  "code": 0,
  "message": "文件删除成功",
  "data": null
}
```

#### 响应字段说明
| 字段名 | 类型 | 描述 |
|--------|------|------|
| code | number | 响应状态码，0表示成功 |
| message | string | 响应消息 |
| data | null | 数据对象（删除操作无返回数据） |

#### 错误情况
- **文件不存在**: 当指定的文件UUID不存在时
- **文件已删除**: 当文件状态已经是"已删除"时
- **系统错误**: 数据库操作失败等内部错误

### 9. 文件恢复（撤销删除）

#### 接口信息
- **路径**: `/file/restore/{file_uuid}`
- **方法**: `POST`
- **描述**: 恢复已软删除的文件，将文件状态从deleted恢复为active

#### 请求参数
| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| file_uuid | string | 是 | 文件UUID（路径参数） |

#### 响应格式
```json
{
  "code": 0,
  "message": "文件恢复成功",
  "data": null
}
```

#### 响应字段说明
| 字段名 | 类型 | 描述 |
|--------|------|------|
| code | number | 响应状态码，0表示成功 |
| message | string | 响应消息 |
| data | null | 数据对象（恢复操作无返回数据） |

#### 错误情况
- **文件不存在**: 当指定的文件UUID不存在时
- **文件未删除**: 当文件状态不是"已删除"时
- **系统错误**: 数据库操作失败等内部错误

## 错误码说明

| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 404 | 文件不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### JavaScript 示例

```javascript
// 获取文件MD5
async function getFileMd5(fileUuid) {
  try {
    const response = await fetch(`/file/md5/${fileUuid}`);
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('文件MD5:', result.data.file_md5);
      return result.data.file_md5;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('获取MD5失败:', error);
    throw error;
  }
}

// 验证文件完整性
async function verifyFileIntegrity(fileUuid, expectedMd5) {
  try {
    const actualMd5 = await getFileMd5(fileUuid);
    
    if (actualMd5 === expectedMd5) {
      console.log('文件完整性验证通过');
      return true;
    } else {
      console.log('文件完整性验证失败');
      return false;
    }
  } catch (error) {
    console.error('验证失败:', error);
    return false;
  }
}

// 软删除文件
async function deleteFile(fileUuid) {
  try {
    const response = await fetch(`/file/delete/${fileUuid}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('文件删除成功');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('文件删除失败:', error);
    throw error;
  }
}

// 恢复已删除的文件（撤销删除）
async function restoreFile(fileUuid) {
  try {
    const response = await fetch(`/file/restore/${fileUuid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('文件恢复成功');
      return true;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('文件恢复失败:', error);
    throw error;
  }
}

// 删除文件并支持撤销（前端集成示例）
async function deleteFileWithUndo(fileUuid, fileName) {
  try {
    // 执行删除操作
    await deleteFile(fileUuid);
    
    // 显示撤销通知（30秒内可撤销）
    const undoNotification = {
      title: '文件已删除',
      message: `文件 "${fileName}" 已删除，30秒内可撤销`,
      duration: 30000,
      actions: [
        {
          text: '撤销删除',
          onClick: async () => {
            try {
              await restoreFile(fileUuid);
              console.log(`文件 "${fileName}" 已恢复`);
              // 关闭通知
              closeNotification(undoNotification);
            } catch (error) {
              console.error('撤销删除失败:', error);
            }
          }
        }
      ]
    };
    
    // 显示通知（具体实现取决于前端框架）
    showNotification(undoNotification);
    
    return true;
  } catch (error) {
    console.error('删除文件失败:', error);
    throw error;
  }
}

// 批量恢复文件
async function restoreFiles(fileUuids) {
  const results = [];
  
  for (const fileUuid of fileUuids) {
    try {
      await restoreFile(fileUuid);
      results.push({ fileUuid, success: true });
    } catch (error) {
      results.push({ fileUuid, success: false, error: error.message });
    }
  }
  
  return results;
}
```

## 注意事项

1. **文件大小限制**: 单个文件最大支持100MB
2. **MD5计算**: MD5值在文件上传时自动计算并存储
3. **文件完整性**: 建议在文件传输后使用MD5验证文件完整性
4. **安全性**: MD5主要用于完整性检查，不适用于安全性要求较高的场景
5. **性能**: MD5计算对大文件可能需要较长时间，请合理使用