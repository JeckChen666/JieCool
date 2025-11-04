-- 文件存储表重构迁移脚本
-- ===== 清理现有对象 =====

-- 删除视图
DROP VIEW IF EXISTS files_with_content;

-- 删除触发器（先删除触发器，再删除函数）
DROP TRIGGER IF EXISTS update_file_contents_updated_at ON file_contents;

-- 删除函数（使用 CASCADE 处理依赖）
DROP FUNCTION IF EXISTS create_file_content() CASCADE;
DROP FUNCTION IF EXISTS update_file_content() CASCADE;
DROP FUNCTION IF EXISTS cleanup_orphaned_contents() CASCADE;

-- 删除索引
DROP INDEX IF EXISTS idx_file_contents_created_at;
DROP INDEX IF EXISTS idx_files_file_content_id;

-- 删除表（使用 CASCADE）
DROP TABLE IF EXISTS file_contents CASCADE;

-- ===== 创建新对象 =====


-- 创建时间: 2025-10-26
-- 描述: 将文件二进制数据从files表分离到专门的file_contents表，提升查询性能

-- 1. 创建文件内容存储表
CREATE TABLE file_contents (
    -- 主键ID，使用BIGSERIAL自增
    id BIGSERIAL PRIMARY KEY,

    -- 文件二进制内容（使用BYTEA存储二进制数据）
    file_content BYTEA NOT NULL,

    -- 缩略图二进制内容（可选，仅图片文件）
    thumbnail_content BYTEA,

    -- 创建时间（用于调试和监控）
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 更新时间（用于内容更新追踪）
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为file_contents表创建索引
CREATE INDEX idx_file_contents_created_at ON file_contents(created_at);

-- 添加表注释
COMMENT ON TABLE file_contents IS '文件内容存储表，用于存储文件和缩略图的二进制数据';
COMMENT ON COLUMN file_contents.id IS '主键ID';
COMMENT ON COLUMN file_contents.file_content IS '文件二进制内容';
COMMENT ON COLUMN file_contents.thumbnail_content IS '缩略图二进制内容';
COMMENT ON COLUMN file_contents.created_at IS '创建时间';
COMMENT ON COLUMN file_contents.updated_at IS '更新时间';

-- 2. 为file_contents表创建更新时间触发器函数（复用现有函数）
-- 为file_contents表创建更新时间触发器
CREATE TRIGGER update_file_contents_updated_at
    BEFORE UPDATE ON file_contents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. 修改files表，添加file_content_id字段
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_content_id BIGINT REFERENCES file_contents(id) ON DELETE RESTRICT;

-- 为file_content_id字段添加索引
CREATE INDEX idx_files_file_content_id ON files(file_content_id);

-- 添加注释
COMMENT ON COLUMN files.file_content_id IS '关联文件内容表ID';

-- 4. 数据迁移：将现有数据从files表迁移到file_contents表
-- 注意：这个迁移需要分批执行，避免锁表时间过长
-- 首先创建临时表存储迁移数据
CREATE TEMPORARY TABLE temp_file_migration AS
SELECT
    id as files_id,
    file_content,
    thumbnail_content,
    created_at
FROM files
WHERE file_content_id IS NULL;

-- 插入数据到file_contents表
INSERT INTO file_contents (file_content, thumbnail_content, created_at)
SELECT
    file_content,
    thumbnail_content,
    created_at
FROM temp_file_migration
ON CONFLICT DO NOTHING;

-- 更新files表的file_content_id字段
UPDATE files
SET file_content_id = fc.id
FROM file_contents fc, temp_file_migration tfm
WHERE files.id = tfm.files_id
  AND fc.file_content = tfm.file_content
  AND fc.thumbnail_content IS NOT DISTINCT FROM tfm.thumbnail_content
  AND files.file_content_id IS NULL;

-- 删除临时表
DROP TABLE IF EXISTS temp_file_migration;

-- 5. 验证数据迁移结果
-- 检查是否还有未迁移的记录
DO $$
DECLARE
    unmigrated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unmigrated_count
    FROM files
    WHERE file_content_id IS NULL;

    IF unmigrated_count > 0 THEN
        RAISE WARNING '警告：还有 % 条记录未完成迁移', unmigrated_count;
    ELSE
        RAISE NOTICE '数据迁移完成：所有文件内容已成功迁移到file_contents表';
    END IF;
END $$;

-- 6. 创建视图以便于查询（可选）
CREATE OR REPLACE VIEW files_with_content AS
SELECT
    f.id,
    f.file_uuid,
    f.file_name,
    f.file_extension,
    f.file_size,
    f.mime_type,
    COALESCE(fc.file_content, f.file_content) as file_content,
    f.file_hash,
    f.file_md5,
    f.has_thumbnail,
    COALESCE(fc.thumbnail_content, f.thumbnail_content) as thumbnail_content,
    f.thumbnail_width,
    f.thumbnail_height,
    f.download_count,
    f.last_download_at,
    f.metadata,
    f.file_status,
    f.file_category,
    f.uploader_ip,
    f.uploader_user_agent,
    f.uploader_id,
    f.created_at,
    f.updated_at,
    f.application_name,
    f.file_content_id
FROM files f
LEFT JOIN file_contents fc ON f.file_content_id = fc.id;

COMMENT ON VIEW files_with_content IS '包含文件内容的完整文件视图（用于向后兼容）';

-- 7. 性能优化建议：
-- 在确认迁移成功后，可以考虑删除原表中的二进制字段以节省空间
-- 注意：这一步需要谨慎操作，建议在维护窗口期执行

-- DROP COLUMN 操作（谨慎使用，建议先备份数据）
-- ALTER TABLE files DROP COLUMN IF EXISTS file_content;
-- ALTER TABLE files DROP COLUMN IF EXISTS thumbnail_content;

-- 8. 创建函数用于自动处理文件内容存储
CREATE OR REPLACE FUNCTION create_file_content(
    p_file_content BYTEA,
    p_thumbnail_content BYTEA DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
    content_id BIGINT;
BEGIN
    INSERT INTO file_contents (file_content, thumbnail_content)
    VALUES (p_file_content, p_thumbnail_content)
    RETURNING id INTO content_id;

    RETURN content_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '创建文件内容失败: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建函数用于更新文件内容
CREATE OR REPLACE FUNCTION update_file_content(
    p_content_id BIGINT,
    p_file_content BYTEA DEFAULT NULL,
    p_thumbnail_content BYTEA DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE file_contents
    SET
        file_content = COALESCE(p_file_content, file_content),
        thumbnail_content = COALESCE(p_thumbnail_content, thumbnail_content),
        updated_at = NOW()
    WHERE id = p_content_id;

    RETURN FOUND;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '更新文件内容失败: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建清理孤立内容的函数
CREATE OR REPLACE FUNCTION cleanup_orphaned_contents() RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- 删除没有关联任何文件的记录
    DELETE FROM file_contents
    WHERE id NOT IN (
        SELECT DISTINCT file_content_id
        FROM files
        WHERE file_content_id IS NOT NULL
    );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '文件存储表重构迁移完成';
    RAISE NOTICE '下一步操作建议：';
    RAISE NOTICE '1. 验证数据迁移是否正确';
    RAISE NOTICE '2. 更新应用程序代码使用新的表结构';
    RAISE NOTICE '3. 测试文件上传下载功能';
    RAISE NOTICE '4. 在确认无误后，可考虑删除原表中的二进制字段以节省空间';
END $$;