# 文件上传二进制数据损坏问题修复

## 问题概述

**发现时间**: 2025-10-07
**问题描述**: 文件上传后，二进制文件（图片、二进制文件）的内容在数据库中被损坏，导致存储的MD5与实际内容的MD5不匹配。  
**影响范围**: 所有包含不可打印字符的文件类型  
**严重程度**: 高 - 数据完整性问题

## 问题诊断过程

### 1. 问题发现
- 用户上传`test.png`文件后，发现文件MD5验证失败
- 数据库中存储的`file_md5`与从`file_content`计算的MD5不匹配

### 2. 问题复现
创建测试脚本验证问题：
```python
# test_binary_file.py - 测试二进制文件上传
# test_new_image.py - 测试图片文件上传
```

### 3. 数据库验证
通过SQL查询验证数据完整性：
```sql
SELECT 
    file_uuid, 
    file_name, 
    file_md5, 
    file_size, 
    length(file_content) as content_length,
    md5(file_content) as calculated_md5,
    CASE 
        WHEN file_md5 = md5(file_content) THEN '✅ 匹配' 
        ELSE '❌ 不匹配' 
    END as md5_status
FROM file_content 
WHERE file_name LIKE '%.png' OR file_name LIKE '%.bin'
ORDER BY id DESC;
```

### 4. 服务器日志分析
发现问题关键信息：
- 上传时计算的MD5正确
- 存储前的MD5验证正确
- 但SQL INSERT语句中的`file_content`显示为损坏的字符串

### 5. 根本原因定位
**核心问题**: GoFrame ORM在处理`[]byte`类型数据时，将二进制数据错误地转换为字符串，导致不可打印字符被损坏。

**技术细节**:
- ORM的`Insert()`方法将`[]byte`数据当作字符串处理
- 不可打印字符在转换过程中被替换或丢失
- PostgreSQL的`bytea`字段接收到的是损坏的字符串数据

## 修复方案

### 解决思路
使用原生SQL语句替代ORM，确保二进制数据正确传递给PostgreSQL。

### 代码修改
**文件**: `server/internal/service/file.go`

**修改前** (使用ORM):
```go
_, err = dao.FileContent.Ctx(ctx).Insert(fileContent)
```

**修改后** (使用原生SQL):
```go
// 使用原生SQL插入，确保二进制数据正确处理
insertSQL := `
    INSERT INTO file_content (file_uuid, file_name, file_size, mime_type, file_md5, file_content, upload_time) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING id
`
result, err := g.DB().GetValue(ctx, insertSQL,
    fileContent.FileUuid,
    fileContent.FileName,
    fileContent.FileSize,
    fileContent.MimeType,
    fileContent.FileMd5,
    fileContent.FileContent, // []byte 直接传递
    fileContent.UploadTime,
)
if err != nil {
    return nil, err
}

// 转换返回的ID
fileID := result.Int64()
```

### 关键技术点
1. **直接传递`[]byte`**: 避免ORM层的类型转换
2. **使用`GetValue()`**: 正确获取返回的ID值
3. **参数化查询**: 防止SQL注入，确保数据安全

## 修复验证

### 测试用例
1. **文本文件测试**: ✅ MD5匹配正常
2. **二进制文件测试**: ✅ MD5匹配正常  
3. **图片文件测试**: ✅ MD5匹配正常

### 验证结果
```sql
-- 修复后的验证查询结果
file_uuid                              | file_name        | md5_status
---------------------------------------|------------------|------------
e321e569-0be0-466b-8ad7-56e62dbbae13  | tmptnx3k2z4.bin | ✅ 匹配
b038d94a-0409-45c8-b106-8713b1f557a8  | tmp_img_xxx.png | ✅ 匹配
```

## 影响评估

### 正面影响
- ✅ 解决了所有二进制文件的数据完整性问题
- ✅ 确保MD5验证机制正常工作
- ✅ 提升了文件存储的可靠性

### 注意事项
- 🔄 历史上传的损坏文件需要重新上传
- 📝 需要更新相关API文档说明修复情况
- 🧪 建议增加自动化测试覆盖二进制文件场景

## 预防措施

### 代码层面
1. **避免ORM处理二进制数据**: 对于`[]byte`类型的大数据，优先使用原生SQL
2. **增加数据完整性检查**: 在关键数据操作后进行MD5验证
3. **完善测试覆盖**: 确保各种文件类型的上传测试

### 监控层面
1. **MD5不匹配告警**: 监控文件完整性验证失败的情况
2. **定期数据校验**: 批量检查历史文件的完整性

## 总结

本次修复成功解决了GoFrame ORM处理二进制数据时的类型转换问题，通过使用原生SQL确保了文件数据的完整性。修复后所有类型的文件上传都能正确保存和验证，大大提升了系统的数据可靠性。

**关键经验**: 在处理二进制数据时，需要特别注意ORM框架的类型转换机制，必要时应使用原生SQL来确保数据完整性。