-- 添加MD5哈希字段迁移脚本
-- 创建时间: 2025-10-07
-- 描述: 为files表添加MD5哈希字段，用于文件完整性校验和重复文件检测
--
-- 功能说明：
-- 1. MD5哈希用于验证文件传输的完整性
-- 2. 支持重复文件检测和去重
-- 3. 提供快速查找相同文件的索引

-- ===== 清理现有对象 =====

-- 删除MD5相关索引（如果存在）
DROP INDEX IF EXISTS idx_files_md5;

-- ===== 创建新对象 =====

-- 为files表添加MD5哈希字段
-- 字段说明：存储32位MD5哈希值（十六进制格式）
-- 约束：VARCHAR(32)确保只能存储标准MD5哈希长度
ALTER TABLE files ADD COLUMN IF NOT EXISTS file_md5 VARCHAR(32);

-- 为MD5字段创建B-tree索引
-- 索引用途：
-- 1. 快速查找相同MD5值的重复文件
-- 2. 支持文件去重查询
-- 3. 提高基于文件内容搜索的性能
CREATE INDEX idx_files_md5 ON files(file_md5);

-- 为MD5字段添加详细注释
COMMENT ON COLUMN files.file_md5 IS 'MD5哈希值，用于文件完整性校验和重复文件检测（32位十六进制字符串）';

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE 'MD5哈希字段添加完成';
    RAISE NOTICE '已添加功能：';
    RAISE NOTICE '1. 文件完整性校验（MD5哈希）';
    RAISE NOTICE '2. 重复文件检测支持';
    RAISE NOTICE '3. 基于文件内容的快速查询索引';
    RAISE NOTICE '注意：现有文件的MD5值需要通过应用程序计算并更新';
END $$;