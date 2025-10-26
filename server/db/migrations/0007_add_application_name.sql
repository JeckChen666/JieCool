-- 添加MD5哈希字段迁移脚本
-- 创建时间: 2025-10-26
-- 描述: 为files表添加应用名称字段，用于文件完整性校验

-- 添加应用名称字段
ALTER TABLE files ADD COLUMN IF NOT EXISTS application_name VARCHAR(50);

-- 为应用名称字段添加索引（可选，用于快速查找）
CREATE INDEX IF NOT EXISTS idx_application_name ON files(application_name);

-- 添加注释
COMMENT ON COLUMN files.application_name IS '应用名称';