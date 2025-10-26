# API 接口文档概览

## 基础信息
- **服务地址**: `http://localhost:8080`
- **响应格式**: 统一 JSON 格式 `{code, message, data}`
- **认证方式**: JWT Bearer Token
- **API 文档**: http://localhost:8080/swagger
- **OpenAPI 规范**: http://localhost:8080/api.json

## 接口分类

### 认证模块 (`/auth`)
- `POST /auth/login` - 用户登录
- `GET /auth/me` - 获取用户信息  
- `POST /auth/logout` - 用户登出
- `POST /auth/generate-url-token` - 生成URL Token

### 文件管理 (`/file`)
- `POST /file/upload` - 文件上传
- `GET /file/download/{file_uuid}` - 文件下载
- `GET /file/info/{file_uuid}` - 文件详情
- `GET /file/list` - 文件列表
- `DELETE /file/delete/{file_uuid}` - 删除文件
- `POST /file/restore/{file_uuid}` - 恢复文件
- `GET /file/thumbnail/{file_uuid}` - 缩略图
- `GET /file/md5/{file_uuid}` - MD5校验
- `GET /file/stats` - 文件统计

### 每日一句 (`/daily`)
- `GET /daily/sentence` - 获取每日一句（无需认证）

### 访问统计 (`/logs`)
- `POST /logs/visit` - 记录访问日志

### 动态配置 (`/config`)
- `GET /config/list` - 配置列表
- `POST /config/refresh` - 刷新缓存

### 微博模块 (`/weibo`)
- `GET /weibo/posts` - 微博文章列表
- `GET /weibo/snapshots` - 微博快照

## 通用响应格式

### 成功响应
```json
{
  "code": 0,
  "message": "OK", 
  "data": {...}
}
```

### 错误响应
```json
{
  "code": 1,
  "message": "错误描述",
  "data": null
}
```

## 认证机制
- 使用 JWT (HS256) 进行身份认证
- Token 在请求头中携带：`Authorization: Bearer <token>`
- 部分接口无需认证（标注 `noAuth: true`）
- Token 失效策略：支持密码更新后统一失效

## 详细文档
各模块详细接口说明请参考：
- [认证接口详情](auth.md)
- [文件管理详情](file_api.md)  
- [每日一句详情](daily.md)
- [配置管理详情](config.md)
- [访问统计详情](visit.md)

## 错误码说明
| 错误码 | 描述 |
|--------|------|
| 0 | 成功 |
| 1 | 业务错误 |
| 401 | 未授权/Token无效 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |