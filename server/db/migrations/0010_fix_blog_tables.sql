-- 修复博客系统表结构迁移脚本
-- 迁移版本：0010
-- ===== 清理现有对象 =====

DROP FUNCTION IF EXISTS update_article_comment_count();
DROP FUNCTION IF EXISTS update_category_article_count();
DROP TRIGGER IF EXISTS update_blog_seo_data_updated_at ON blog_article_versions;
DROP TRIGGER IF EXISTS trigger_update_article_comment_count ON blog_article_versions;
DROP TRIGGER IF EXISTS trigger_update_category_article_count ON blog_article_versions;
DROP INDEX IF EXISTS idx_blog_article_versions_article_id;

-- ===== 清理现有对象 =====

-- 删除触发器
DROP TRIGGER IF EXISTS update_blog_seo_data_updated_at ON blog_seo_data;
DROP TRIGGER IF EXISTS trigger_update_article_comment_count ON blog_comments;
DROP TRIGGER IF EXISTS trigger_update_category_article_count ON blog_articles;

-- 删除函数（使用 CASCADE）
DROP FUNCTION IF EXISTS update_article_comment_count() CASCADE;
DROP FUNCTION IF EXISTS update_category_article_count() CASCADE;

-- 删除索引
DROP INDEX IF EXISTS idx_blog_article_versions_article_id;
DROP INDEX IF EXISTS idx_blog_article_versions_created_at;
DROP INDEX IF EXISTS idx_blog_seo_data_article_id;
DROP INDEX IF EXISTS idx_blog_comments_status;
DROP INDEX IF EXISTS idx_blog_comments_is_deleted;

-- 删除表（使用 CASCADE）
DROP TABLE IF EXISTS blog_seo_data CASCADE;
DROP TABLE IF EXISTS blog_article_versions CASCADE;

-- ===== 创建新对象 =====

DROP INDEX IF EXISTS idx_blog_article_versions_created_at;
DROP INDEX IF EXISTS idx_blog_seo_data_article_id;
DROP INDEX IF EXISTS idx_blog_comments_status;
DROP INDEX IF EXISTS idx_blog_comments_is_deleted;
-- 删除blog_article_versions表的约束
-- 删除blog_seo_data表的约束
-- 删除表（按依赖关系逆序删除）
DROP TABLE IF EXISTS blog_seo_data;
DROP TABLE IF EXISTS blog_article_versions;

-- ===== 创建新对象 =====


-- 创建时间: 2025-11-03
-- 描述: 修复博客系统缺失的表和字段不一致问题（在0009创建博客表之后执行）

-- 1. 创建缺失的博客文章版本表
CREATE TABLE blog_article_versions (
    id BIGSERIAL PRIMARY KEY,
    version_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    html_content TEXT,
    summary TEXT,
    change_type VARCHAR(20) NOT NULL, -- create, update, delete
    change_summary TEXT,
    diff_data JSONB,
    operator_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建缺失的博客SEO数据表
CREATE TABLE blog_seo_data (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    og_title VARCHAR(255),
    og_description TEXT,
    og_image VARCHAR(255),
    twitter_title VARCHAR(255),
    twitter_description TEXT,
    twitter_image VARCHAR(255),
    canonical_url VARCHAR(500),
    json_ld JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id)
);

-- 3. 修复 blog_comments 表结构不一致问题
-- 检查并添加缺失的字段
DO $$
BEGIN
    -- 检查并添加缺失的字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'visitor_website') THEN
        ALTER TABLE blog_comments ADD COLUMN visitor_website VARCHAR(255);
        COMMENT ON COLUMN blog_comments.visitor_website IS '访客网站（可选）';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'html_content') THEN
        ALTER TABLE blog_comments ADD COLUMN html_content TEXT;
        COMMENT ON COLUMN blog_comments.html_content IS 'HTML渲染内容';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'is_deleted') THEN
        ALTER TABLE blog_comments ADD COLUMN is_deleted BOOLEAN DEFAULT false;
        COMMENT ON COLUMN blog_comments.is_deleted IS '是否已删除';
    END IF;

    -- 修正字段名不一致的问题（如果存在 ip_address 字段，重命名为 ip）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'ip_address') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'ip') THEN
        ALTER TABLE blog_comments RENAME COLUMN ip_address TO ip;
    END IF;

    -- 修正字段名不一致的问题（如果存在 user_agent 字段，重命名为 download_user_agent）
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'user_agent') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_comments' AND column_name = 'download_user_agent') THEN
        ALTER TABLE blog_comments RENAME COLUMN user_agent TO download_user_agent;
    END IF;
END $$;

-- 4. 创建缺失的索引
-- 文章版本表索引
CREATE INDEX idx_blog_article_versions_article_id ON blog_article_versions(article_id);
CREATE INDEX idx_blog_article_versions_created_at ON blog_article_versions(created_at);

-- SEO数据表索引
CREATE INDEX idx_blog_seo_data_article_id ON blog_seo_data(article_id);

-- 评论表索引修正
CREATE INDEX idx_blog_comments_status ON blog_comments(status);
CREATE INDEX idx_blog_comments_is_deleted ON blog_comments(is_deleted);

-- 5. 为 blog_seo_data 表创建更新时间触发器（复用现有的update_updated_at_column函数）
CREATE TRIGGER update_blog_seo_data_updated_at
    BEFORE UPDATE ON blog_seo_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 添加表注释
COMMENT ON TABLE blog_article_versions IS '博客文章版本历史表';
COMMENT ON TABLE blog_seo_data IS '博客文章SEO数据表';

-- 7. 添加列注释
COMMENT ON COLUMN blog_article_versions.version_id IS '版本唯一标识';
COMMENT ON COLUMN blog_article_versions.version IS '版本号';
COMMENT ON COLUMN blog_article_versions.change_type IS '变更类型：create/update/delete';
COMMENT ON COLUMN blog_article_versions.change_summary IS '变更摘要';
COMMENT ON COLUMN blog_article_versions.diff_data IS '差异数据（JSON格式）';
COMMENT ON COLUMN blog_article_versions.operator_id IS '操作者ID';

COMMENT ON COLUMN blog_seo_data.meta_title IS 'SEO标题';
COMMENT ON COLUMN blog_seo_data.meta_description IS 'SEO描述';
COMMENT ON COLUMN blog_seo_data.meta_keywords IS 'SEO关键词';
COMMENT ON COLUMN blog_seo_data.og_title IS 'Open Graph标题';
COMMENT ON COLUMN blog_seo_data.og_description IS 'Open Graph描述';
COMMENT ON COLUMN blog_seo_data.og_image IS 'Open Graph图片';
COMMENT ON COLUMN blog_seo_data.twitter_title IS 'Twitter卡片标题';
COMMENT ON COLUMN blog_seo_data.twitter_description IS 'Twitter卡片描述';
COMMENT ON COLUMN blog_seo_data.twitter_image IS 'Twitter卡片图片';
COMMENT ON COLUMN blog_seo_data.canonical_url IS '规范URL';
COMMENT ON COLUMN blog_seo_data.json_ld IS 'JSON-LD结构化数据';

-- 8. 创建触发器函数用于自动更新文章统计信息
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_articles
        SET comment_count = comment_count + 1
        WHERE id = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_articles
        SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE id = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：评论变更时自动更新文章评论数
DROP TRIGGER IF EXISTS trigger_update_article_comment_count ON blog_comments;
CREATE TRIGGER trigger_update_article_comment_count
    AFTER INSERT OR DELETE ON blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comment_count();

-- 9. 创建函数用于自动更新分类文章数
CREATE OR REPLACE FUNCTION update_category_article_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE blog_categories
        SET article_count = article_count + 1
        WHERE id = NEW.category_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
            UPDATE blog_categories
            SET article_count = GREATEST(article_count - 1, 0)
            WHERE id = OLD.category_id;

            UPDATE blog_categories
            SET article_count = article_count + 1
            WHERE id = NEW.category_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE blog_categories
        SET article_count = GREATEST(article_count - 1, 0)
        WHERE id = OLD.category_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：文章变更时自动更新分类文章数
DROP TRIGGER IF EXISTS trigger_update_category_article_count ON blog_articles;
CREATE TRIGGER trigger_update_category_article_count
    AFTER INSERT OR UPDATE OR DELETE ON blog_articles
    FOR EACH ROW
    EXECUTE FUNCTION update_category_article_count();

-- 迁移完成提示
DO $$
BEGIN
    RAISE NOTICE '博客系统表结构修复完成';
    RAISE NOTICE '已修复的内容：';
    RAISE NOTICE '1. 创建缺失的 blog_article_versions 表';
    RAISE NOTICE '2. 创建缺失的 blog_seo_data 表';
    RAISE NOTICE '3. 修复 blog_comments 表字段不一致问题';
    RAISE NOTICE '4. 创建必要的索引和触发器';
    RAISE NOTICE '5. 添加统计信息自动更新功能';
END $$;