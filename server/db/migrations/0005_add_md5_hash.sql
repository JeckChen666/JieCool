-- 添加MD5哈希字段迁移脚本
-- 创建时间: 2025-01-27
-- 描述: 为files表添加MD5哈希字段，用于文件完整性校验

-- 添加MD5哈希字段
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_md5 VARCHAR(32);

-- 为MD5字段添加索引（可选，用于快速查找）
CREATE INDEX IF NOT EXISTS idx_files_md5 ON files(file_md5);

-- 添加注释
COMMENT ON COLUMN files.file_md5 IS 'MD5哈希值，用于文件完整性校验';