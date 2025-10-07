# 文件管理数据库表结构

## 概述
文件管理模块使用以下数据库表来存储文件信息和相关数据。

## 表结构

### 1. files 表
存储文件的基本信息和元数据。

```sql
CREATE TABLE files (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    file_uuid VARCHAR(36) NOT NULL UNIQUE COMMENT '文件唯一标识UUID',
    file_name VARCHAR(255) NOT NULL COMMENT '原始文件名',
    file_path VARCHAR(500) NOT NULL COMMENT '文件存储路径',
    file_size BIGINT NOT NULL COMMENT '文件大小（字节）',
    file_hash VARCHAR(64) NOT NULL COMMENT '文件SHA256哈希值',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME类型',
    extension VARCHAR(20) NOT NULL COMMENT '文件扩展名',
    category VARCHAR(50) DEFAULT 'other' COMMENT '文件分类',
    uploader_id BIGINT DEFAULT 0 COMMENT '上传者ID',
    uploader_ip VARCHAR(45) COMMENT '上传者IP地址',
    user_agent TEXT COMMENT '上传者User-Agent',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    file_status TINYINT DEFAULT 1 COMMENT '文件状态：1-正常，2-已删除',
    has_thumbnail TINYINT DEFAULT 0 COMMENT '是否有缩略图：0-无，1-有',
    thumbnail_path VARCHAR(500) COMMENT '缩略图存储路径',
    thumbnail_width INT COMMENT '缩略图宽度',
    thumbnail_height INT COMMENT '缩略图高度',
    last_download_at DATETIME COMMENT '最后下载时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_file_uuid (file_uuid),
    INDEX idx_file_hash (file_hash),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_category (category),
    INDEX idx_extension (extension),
    INDEX idx_file_status (file_status),
    INDEX idx_created_at (created_at),
    INDEX idx_download_count (download_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件信息表';
```

### 2. file_download_logs 表（可选）
记录文件下载日志，用于详细的下载统计分析。

```sql
CREATE TABLE file_download_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
    file_uuid VARCHAR(36) NOT NULL COMMENT '文件UUID',
    downloader_ip VARCHAR(45) COMMENT '下载者IP地址',
    user_agent TEXT COMMENT '下载者User-Agent',
    referer VARCHAR(500) COMMENT '来源页面',
    download_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '下载时间',
    
    INDEX idx_file_uuid (file_uuid),
    INDEX idx_download_time (download_time),
    INDEX idx_downloader_ip (downloader_ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件下载日志表';
```

## 字段说明

### files 表字段详解

| 字段名 | 类型 | 说明 | 备注 |
|--------|------|------|------|
| id | BIGINT | 主键ID | 自增 |
| file_uuid | VARCHAR(36) | 文件唯一标识 | UUID格式，用于外部访问 |
| file_name | VARCHAR(255) | 原始文件名 | 用户上传时的文件名 |
| file_path | VARCHAR(500) | 文件存储路径 | 服务器上的实际存储路径 |
| file_size | BIGINT | 文件大小 | 单位：字节 |
| file_hash | VARCHAR(64) | 文件哈希值 | SHA256哈希，用于去重 |
| mime_type | VARCHAR(100) | MIME类型 | 如：image/jpeg, application/pdf |
| extension | VARCHAR(20) | 文件扩展名 | 如：jpg, pdf, txt |
| category | VARCHAR(50) | 文件分类 | 如：image, document, video |
| uploader_id | BIGINT | 上传者ID | 关联用户表，0表示匿名上传 |
| uploader_ip | VARCHAR(45) | 上传者IP | 支持IPv4和IPv6 |
| user_agent | TEXT | 用户代理 | 浏览器信息 |
| download_count | INT | 下载次数 | 统计下载次数 |
| file_status | TINYINT | 文件状态 | 1-正常，2-已删除 |
| has_thumbnail | TINYINT | 是否有缩略图 | 0-无，1-有 |
| thumbnail_path | VARCHAR(500) | 缩略图路径 | 缩略图存储路径 |
| thumbnail_width | INT | 缩略图宽度 | 像素 |
| thumbnail_height | INT | 缩略图高度 | 像素 |
| last_download_at | DATETIME | 最后下载时间 | 记录最近一次下载时间 |
| created_at | DATETIME | 创建时间 | 文件上传时间 |
| updated_at | DATETIME | 更新时间 | 记录更新时间 |

## 索引说明

### 主要索引
- `PRIMARY KEY (id)`: 主键索引
- `UNIQUE KEY (file_uuid)`: 文件UUID唯一索引
- `INDEX idx_file_hash (file_hash)`: 文件哈希索引，用于去重检查
- `INDEX idx_uploader_id (uploader_id)`: 上传者索引，用于查询用户文件
- `INDEX idx_category (category)`: 分类索引，用于分类筛选
- `INDEX idx_extension (extension)`: 扩展名索引，用于格式筛选
- `INDEX idx_file_status (file_status)`: 状态索引，用于筛选有效文件
- `INDEX idx_created_at (created_at)`: 创建时间索引，用于时间排序
- `INDEX idx_download_count (download_count)`: 下载次数索引，用于热门文件排序

## 数据维护

### 定期清理
1. 定期清理已删除状态的文件记录
2. 清理对应的物理文件和缩略图
3. 清理过期的下载日志

### 统计信息
1. 文件总数统计
2. 存储空间使用统计
3. 下载热度统计
4. 文件类型分布统计

### 备份策略
1. 定期备份文件数据表
2. 备份重要文件的物理文件
3. 保留下载日志用于分析