# 文件管理API接口文档

## 概述
文件管理模块提供了完整的文件上传、下载、管理功能，支持多种文件类型和缩略图生成。

## 接口列表

### 1. 文件上传
- **接口路径**: `POST /file/upload`
- **功能描述**: 上传文件到服务器，支持多种文件类型，自动生成缩略图
- **请求参数**:
  ```typescript
  interface UploadFileReq {
    file: File;        // 上传的文件
    category?: string; // 文件分类（可选）
  }
  ```
- **响应参数**:
  ```typescript
  interface UploadFileRes {
    FileUuid: string;      // 文件唯一标识
    FileName: string;      // 文件名
    FileSize: number;      // 文件大小（字节）
    MimeType: string;      // MIME类型
    Extension: string;     // 文件扩展名
    DownloadUrl: string;   // 下载链接
    ThumbnailUrl?: string; // 缩略图链接（图片文件）
  }
  ```

### 2. 文件下载
- **接口路径**: `GET /file/download/{file_uuid}`
- **功能描述**: 下载指定文件，支持缓存优化和下载统计
- **请求参数**:
  - `file_uuid`: 文件唯一标识（路径参数）
- **响应**: 文件二进制流
- **响应头**:
  - `Content-Type`: 文件MIME类型
  - `Content-Length`: 文件大小
  - `Content-Disposition`: 文件下载名称
  - `Cache-Control`: 缓存控制
  - `ETag`: 文件标识
  - `Last-Modified`: 最后修改时间

### 3. 获取文件信息
- **接口路径**: `GET /file/info/{file_uuid}`
- **功能描述**: 获取指定文件的详细信息
- **请求参数**:
  - `file_uuid`: 文件唯一标识（路径参数）
- **响应参数**:
  ```typescript
  interface GetFileInfoRes {
    FileUuid: string;        // 文件唯一标识
    FileName: string;        // 文件名
    FileSize: number;        // 文件大小
    MimeType: string;        // MIME类型
    Extension: string;       // 文件扩展名
    DownloadCount: number;   // 下载次数
    UploadedAt: string;      // 上传时间
    LastDownloadAt?: string; // 最后下载时间
    DownloadUrl: string;     // 下载链接
    ThumbnailUrl?: string;   // 缩略图链接
  }
  ```

### 4. 获取文件列表
- **接口路径**: `GET /file/list`
- **功能描述**: 获取文件列表，支持分页和筛选
- **请求参数**:
  ```typescript
  interface GetFileListReq {
    page?: number;     // 页码（默认1）
    pageSize?: number; // 每页数量（默认10）
    keyword?: string;  // 搜索关键词
    extension?: string; // 文件扩展名筛选
  }
  ```
- **响应参数**:
  ```typescript
  interface GetFileListRes {
    List: FileListItem[];  // 文件列表
    Total: number;         // 总数量
    Page: number;          // 当前页码
    PageSize: number;      // 每页数量
    TotalPages: number;    // 总页数
  }
  
  interface FileListItem {
    FileUuid: string;        // 文件唯一标识
    FileName: string;        // 文件名
    FileSize: number;        // 文件大小
    MimeType: string;        // MIME类型
    Extension: string;       // 文件扩展名
    DownloadCount: number;   // 下载次数
    UploadedAt: string;      // 上传时间
    LastDownloadAt?: string; // 最后下载时间
    DownloadUrl: string;     // 下载链接
    ThumbnailUrl?: string;   // 缩略图链接
  }
  ```

### 5. 删除文件
- **接口路径**: `GET /file/delete/{file_uuid}`
- **功能描述**: 删除指定文件
- **请求参数**:
  - `file_uuid`: 文件唯一标识（路径参数）
- **响应参数**:
  ```typescript
  interface DeleteFileRes {
    Success: boolean; // 删除是否成功
    Message: string;  // 响应消息
  }
  ```

### 6. 获取文件统计
- **接口路径**: `GET /file/stats`
- **功能描述**: 获取文件统计信息
- **响应参数**:
  ```typescript
  interface GetFileStatsRes {
    TotalFiles: number;      // 总文件数
    TotalSize: number;       // 总文件大小
    TotalDownloads: number;  // 总下载次数
    CategoryStats: Record<string, number>;   // 分类统计
    ExtensionStats: Record<string, number>;  // 扩展名统计
    SizeDistribution: Record<string, number>; // 大小分布
  }
  ```

### 7. 获取缩略图
- **接口路径**: `GET /file/thumbnail/{file_uuid}`
- **功能描述**: 获取图片文件的缩略图
- **请求参数**:
  - `file_uuid`: 文件唯一标识（路径参数）
- **响应**: 缩略图二进制流

## 错误码说明
- `200`: 成功
- `400`: 请求参数错误
- `404`: 文件不存在
- `500`: 服务器内部错误

## 注意事项
1. 文件上传支持的最大大小为100MB
2. 图片文件会自动生成缩略图（200x200像素）
3. 支持的图片格式：jpg、jpeg、png、gif、webp
4. 文件下载会记录下载统计信息
5. 删除文件会同时删除对应的缩略图文件