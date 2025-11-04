-- 文件管理表迁移脚本
-- ===== 清理现有对象 =====

-- 删除触发器（先删除触发器，再删除函数）
DROP TRIGGER IF EXISTS update_files_updated_at ON files;
DROP TRIGGER IF EXISTS update_file_download_logs_updated_at ON file_download_logs;

-- 删除函数（使用 CASCADE 处理依赖）
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP INDEX IF EXISTS idx_files_file_uuid;
DROP INDEX IF EXISTS idx_files_file_hash;
DROP INDEX IF EXISTS idx_files_file_extension;
DROP INDEX IF EXISTS idx_files_file_category;
DROP INDEX IF EXISTS idx_files_file_status;
DROP INDEX IF EXISTS idx_files_created_at;
DROP INDEX IF EXISTS idx_files_download_count;
DROP INDEX IF EXISTS idx_files_status_category;
DROP INDEX IF EXISTS idx_files_extension_status;
DROP INDEX IF EXISTS idx_files_metadata_gin;
DROP INDEX IF EXISTS idx_file_download_logs_file_id;
DROP INDEX IF EXISTS idx_file_download_logs_file_uuid;
DROP INDEX IF EXISTS idx_file_download_logs_download_time;
DROP INDEX IF EXISTS idx_file_download_logs_download_ip;
-- 删除files表的约束
-- 删除file_download_logs表的约束
-- 删除表（按依赖关系逆序删除，使用 CASCADE）
DROP TABLE IF EXISTS file_download_logs CASCADE;
DROP TABLE IF EXISTS files CASCADE;

-- ===== 创建新对象 =====


-- 创建时间: 2025-01-27
-- 描述: 实现文件上传下载功能，将文件存储在PostgreSQL数据库中

-- 文件存储主表
CREATE TABLE files (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,
    
    -- 文件唯一标识符，用于外部访问（UUID格式）
    file_uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    
    -- 文件基本信息
    file_name TEXT NOT NULL,                    -- 原始文件名
    file_extension VARCHAR(20) NOT NULL,       -- 文件扩展名（不含点号，如：jpg, pdf, docx）
    file_size BIGINT NOT NULL,                 -- 文件大小（字节）
    mime_type VARCHAR(255) NOT NULL,           -- MIME类型（如：image/jpeg, application/pdf）
    
    -- 文件内容存储（使用BYTEA存储二进制数据）
    file_content BYTEA NOT NULL,               -- 文件二进制内容
    
    -- 文件哈希值（用于去重和完整性校验）
    file_hash VARCHAR(64) NOT NULL,            -- SHA256哈希值
    
    -- 缩略图相关（仅图片文件）
    has_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,  -- 是否有缩略图
    thumbnail_content BYTEA,                   -- 缩略图二进制内容
    thumbnail_width INTEGER,                   -- 缩略图宽度
    thumbnail_height INTEGER,                  -- 缩略图高度
    
    -- 统计信息
    download_count BIGINT NOT NULL DEFAULT 0,  -- 下载次数
    last_download_at TIMESTAMPTZ,             -- 最近一次下载时间
    
    -- 文件元数据（使用JSONB存储扩展信息）
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,  -- 文件元数据（如：图片尺寸、拍摄信息等）
    
    -- 文件状态和分类
    file_status VARCHAR(20) NOT NULL DEFAULT 'active',  -- 文件状态：active, deleted, archived
    file_category VARCHAR(50),                 -- 文件分类（如：image, document, video, audio, other）
    
    -- 上传者信息（预留字段，后续可关联用户系统）
    uploader_ip INET,                          -- 上传者IP地址
    uploader_user_agent TEXT,                  -- 上传者User-Agent
    uploader_id BIGINT,                        -- 上传者用户ID（预留）
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),     -- 创建时间
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()      -- 更新时间
);

-- 创建索引优化查询性能
CREATE INDEX idx_files_file_uuid ON files(file_uuid);
CREATE INDEX idx_files_file_hash ON files(file_hash);
CREATE INDEX idx_files_file_extension ON files(file_extension);
CREATE INDEX idx_files_file_category ON files(file_category);
CREATE INDEX idx_files_file_status ON files(file_status);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_download_count ON files(download_count);

-- 创建复合索引
CREATE INDEX idx_files_status_category ON files(file_status, file_category);
CREATE INDEX idx_files_extension_status ON files(file_extension, file_status);

-- 创建GIN索引用于JSONB元数据查询
CREATE INDEX idx_files_metadata_gin ON files USING GIN(metadata);

-- 添加表注释
COMMENT ON TABLE files IS '文件存储表，用于存储上传的文件及其元数据';
COMMENT ON COLUMN files.id IS '主键ID';
COMMENT ON COLUMN files.file_uuid IS '文件唯一标识符，用于外部访问';
COMMENT ON COLUMN files.file_name IS '原始文件名';
COMMENT ON COLUMN files.file_extension IS '文件扩展名（不含点号）';
COMMENT ON COLUMN files.file_size IS '文件大小（字节）';
COMMENT ON COLUMN files.mime_type IS 'MIME类型';
COMMENT ON COLUMN files.file_content IS '文件二进制内容';
COMMENT ON COLUMN files.file_hash IS 'SHA256哈希值，用于去重和完整性校验';
COMMENT ON COLUMN files.has_thumbnail IS '是否有缩略图';
COMMENT ON COLUMN files.thumbnail_content IS '缩略图二进制内容';
COMMENT ON COLUMN files.thumbnail_width IS '缩略图宽度';
COMMENT ON COLUMN files.thumbnail_height IS '缩略图高度';
COMMENT ON COLUMN files.download_count IS '下载次数';
COMMENT ON COLUMN files.last_download_at IS '最近一次下载时间';
COMMENT ON COLUMN files.metadata IS '文件元数据（JSONB格式）';
COMMENT ON COLUMN files.file_status IS '文件状态：active, deleted, archived';
COMMENT ON COLUMN files.file_category IS '文件分类';
COMMENT ON COLUMN files.uploader_ip IS '上传者IP地址';
COMMENT ON COLUMN files.uploader_user_agent IS '上传者User-Agent';
COMMENT ON COLUMN files.uploader_id IS '上传者用户ID（预留）';
COMMENT ON COLUMN files.created_at IS '创建时间';
COMMENT ON COLUMN files.updated_at IS '更新时间';

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为files表创建更新时间触发器
CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建文件下载日志表（可选，用于详细的下载统计）
CREATE TABLE file_download_logs (
    id BIGSERIAL PRIMARY KEY,
    file_id BIGINT NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_uuid UUID NOT NULL,                   -- 冗余存储，便于查询
    download_ip INET,                           -- 下载者IP
    download_user_agent TEXT,                   -- 下载者User-Agent
    download_referer TEXT,                      -- 下载来源页面
    download_size BIGINT,                       -- 实际下载大小（支持断点续传）
    download_status VARCHAR(20) DEFAULT 'success',  -- 下载状态：success, failed, partial
    download_time TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- 下载时间
);

-- 为下载日志表创建索引
CREATE INDEX idx_file_download_logs_file_id ON file_download_logs(file_id);
CREATE INDEX idx_file_download_logs_file_uuid ON file_download_logs(file_uuid);
CREATE INDEX idx_file_download_logs_download_time ON file_download_logs(download_time);
CREATE INDEX idx_file_download_logs_download_ip ON file_download_logs(download_ip);

-- 添加下载日志表注释
COMMENT ON TABLE file_download_logs IS '文件下载日志表，记录详细的下载统计信息';
COMMENT ON COLUMN file_download_logs.file_id IS '关联的文件ID';
COMMENT ON COLUMN file_download_logs.file_uuid IS '文件UUID（冗余存储）';
COMMENT ON COLUMN file_download_logs.download_ip IS '下载者IP地址';
COMMENT ON COLUMN file_download_logs.download_user_agent IS '下载者User-Agent';
COMMENT ON COLUMN file_download_logs.download_referer IS '下载来源页面';
COMMENT ON COLUMN file_download_logs.download_size IS '实际下载大小';
COMMENT ON COLUMN file_download_logs.download_status IS '下载状态';
COMMENT ON COLUMN file_download_logs.download_time IS '下载时间';