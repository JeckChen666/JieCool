-- 添加应用名称字段迁移脚本
-- 创建时间: 2025-10-26
-- 描述: 为files表添加应用名称字段，用于文件来源识别和管理
--
-- 功能说明：
-- 1. 标识文件上传来源的应用模块
-- 2. 支持按应用分类管理文件
-- 3. 提供文件来源追踪和统计功能
--
-- 应用场景：
-- - 区分不同功能模块上传的文件（如：weibo、blog、system等）
-- - 支持按应用模块进行文件清理和管理
-- - 提供文件使用情况的统计分析

-- ===== 清理现有对象 =====

-- 删除应用名称相关索引（如果存在）
DROP INDEX IF EXISTS idx_application_name;

-- ===== 创建新对象 =====

-- 为files表添加应用名称字段
-- 字段说明：标识文件上传来源的应用模块名称
-- 约束：VARCHAR(50)限制应用名称长度，支持常见应用名称
-- 默认值：NULL表示未指定应用来源
ALTER TABLE files ADD COLUMN IF NOT EXISTS application_name VARCHAR(50);

-- 为应用名称字段创建B-tree索引
-- 索引用途：
-- 1. 按应用模块快速筛选文件
-- 2. 支持应用级别的文件统计查询
-- 3. 优化基于应用名称的文件管理操作性能
CREATE INDEX idx_application_name ON files(application_name);

-- 为应用名称字段添加详细注释
COMMENT ON COLUMN files.application_name IS '文件来源应用名称（如：weibo、blog、system等），用于文件分类和管理';

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '应用名称字段添加完成';
    RAISE NOTICE '已添加功能：';
    RAISE NOTICE '1. 文件来源应用标识';
    RAISE NOTICE '2. 按应用模块分类管理';
    RAISE NOTICE '3. 应用级别文件统计支持';
    RAISE NOTICE '4. 文件来源追踪和分析';
    RAISE NOTICE '注意：现有文件的application_name字段将为NULL，需要通过应用程序更新';
END $$;