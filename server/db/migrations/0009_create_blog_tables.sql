-- 博客模块数据库表创建脚本
-- 迁移版本：0009
-- ===== 清理现有对象 =====

DROP INDEX IF EXISTS idx_blog_articles_author_id;
DROP INDEX IF EXISTS idx_blog_articles_slug;
DROP INDEX IF EXISTS idx_blog_articles_status;
DROP INDEX IF EXISTS idx_blog_articles_created_at;
DROP INDEX IF EXISTS idx_blog_articles_publish_at;
DROP INDEX IF EXISTS idx_blog_articles_is_top;
DROP INDEX IF EXISTS idx_blog_articles_title;
DROP INDEX IF EXISTS idx_blog_articles_content;
DROP INDEX IF EXISTS idx_blog_articles_deleted_at;
DROP INDEX IF EXISTS idx_blog_categories_parent_id;
DROP INDEX IF EXISTS idx_blog_categories_slug;
DROP INDEX IF EXISTS idx_blog_categories_is_active;
DROP INDEX IF EXISTS idx_blog_tags_slug;
DROP INDEX IF EXISTS idx_blog_tags_is_active;
DROP INDEX IF EXISTS idx_blog_article_tags_article_id;
DROP INDEX IF EXISTS idx_blog_article_tags_tag_id;
DROP INDEX IF EXISTS idx_blog_comments_article_id;
DROP INDEX IF EXISTS idx_blog_comments_parent_id;
DROP INDEX IF EXISTS idx_blog_comments_created_at;
DROP INDEX IF EXISTS idx_blog_comments_status;
DROP INDEX IF EXISTS idx_blog_comments_is_deleted;
DROP INDEX IF EXISTS idx_blog_article_versions_article_id;
DROP INDEX IF EXISTS idx_blog_article_versions_created_at;
DROP INDEX IF EXISTS idx_blog_seo_data_article_id;
-- 删除blog_categories表的约束
-- 删除blog_tags表的约束
-- 删除blog_articles表的约束
-- 删除blog_article_tags表的约束
-- 删除blog_article_versions表的约束
-- 删除blog_comments表的约束
-- 删除blog_seo_data表的约束
-- 删除表（按依赖关系逆序删除，使用 CASCADE）
DROP TABLE IF EXISTS blog_seo_data CASCADE;
DROP TABLE IF EXISTS blog_comments CASCADE;
DROP TABLE IF EXISTS blog_article_versions CASCADE;
DROP TABLE IF EXISTS blog_article_tags CASCADE;
DROP TABLE IF EXISTS blog_articles CASCADE;
DROP TABLE IF EXISTS blog_tags CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;

-- ===== 创建新对象 =====


-- 创建时间：2025-10-28

-- 1. 创建博客文章分类表
CREATE TABLE blog_categories (
    id BIGSERIAL PRIMARY KEY,
    category_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id BIGINT REFERENCES blog_categories(id),
    sort_order INTEGER DEFAULT 0,
    article_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建博客标签表
CREATE TABLE blog_tags (
    id BIGSERIAL PRIMARY KEY,
    tag_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    article_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建博客文章主表
CREATE TABLE blog_articles (
    id BIGSERIAL PRIMARY KEY,
    article_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    html_content TEXT,
    author_id BIGINT NOT NULL DEFAULT 1, -- 默认管理员ID
    category_id BIGINT REFERENCES blog_categories(id),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, private, archive
    is_draft BOOLEAN DEFAULT true,
    is_top BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    featured_image VARCHAR(255),
    read_time INTEGER DEFAULT 0, -- 预估阅读时间（分钟）
    publish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- 4. 创建文章标签关联表
CREATE TABLE blog_article_tags (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    tag_id BIGINT REFERENCES blog_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(article_id, tag_id)
);

-- 5. 创建文章版本表
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

-- 6. 创建博客评论表（简化版）
CREATE TABLE blog_comments (
    id BIGSERIAL PRIMARY KEY,
    comment_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    article_id BIGINT REFERENCES blog_articles(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES blog_comments(id) ON DELETE CASCADE,
    visitor_name VARCHAR(50) NOT NULL,
    visitor_email VARCHAR(255),
    visitor_website VARCHAR(255),
    content TEXT NOT NULL,
    html_content TEXT,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'approved', -- approved, pending, deleted
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 创建SEO数据表
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

-- 创建索引
-- 文章表索引
CREATE INDEX idx_blog_articles_author_id ON blog_articles(author_id);
CREATE INDEX idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX idx_blog_articles_status ON blog_articles(status);
CREATE INDEX idx_blog_articles_created_at ON blog_articles(created_at);
CREATE INDEX idx_blog_articles_publish_at ON blog_articles(publish_at);
CREATE INDEX idx_blog_articles_is_top ON blog_articles(is_top);
CREATE INDEX idx_blog_articles_title ON blog_articles USING gin(to_tsvector('simple', title));
CREATE INDEX idx_blog_articles_content ON blog_articles USING gin(to_tsvector('simple', content));
CREATE INDEX idx_blog_articles_deleted_at ON blog_articles(deleted_at);

-- 分类表索引
CREATE INDEX idx_blog_categories_parent_id ON blog_categories(parent_id);
CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_categories_is_active ON blog_categories(is_active);

-- 标签表索引
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);
CREATE INDEX idx_blog_tags_is_active ON blog_tags(is_active);

-- 文章标签关联表索引
CREATE INDEX idx_blog_article_tags_article_id ON blog_article_tags(article_id);
CREATE INDEX idx_blog_article_tags_tag_id ON blog_article_tags(tag_id);

-- 评论表索引
CREATE INDEX idx_blog_comments_article_id ON blog_comments(article_id);
CREATE INDEX idx_blog_comments_parent_id ON blog_comments(parent_id);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);
CREATE INDEX idx_blog_comments_is_deleted ON blog_comments(is_deleted);

-- 文章版本表索引
CREATE INDEX idx_blog_article_versions_article_id ON blog_article_versions(article_id);
CREATE INDEX idx_blog_article_versions_created_at ON blog_article_versions(created_at);

-- SEO数据表索引
CREATE INDEX idx_blog_seo_data_article_id ON blog_seo_data(article_id);

-- 添加表注释
COMMENT ON TABLE blog_categories IS '博客文章分类表';
COMMENT ON TABLE blog_tags IS '博客文章标签表';
COMMENT ON TABLE blog_articles IS '博客文章主表';
COMMENT ON TABLE blog_article_tags IS '博客文章标签关联表';
COMMENT ON TABLE blog_article_versions IS '博客文章版本历史表';
COMMENT ON TABLE blog_comments IS '博客评论表（支持匿名评论）';
COMMENT ON TABLE blog_seo_data IS '博客文章SEO数据表';

-- 添加列注释
COMMENT ON COLUMN blog_categories.category_id IS '分类唯一标识';
COMMENT ON COLUMN blog_categories.slug IS 'URL友好标识';
COMMENT ON COLUMN blog_categories.parent_id IS '父分类ID';
COMMENT ON COLUMN blog_categories.sort_order IS '排序顺序';

COMMENT ON COLUMN blog_tags.tag_id IS '标签唯一标识';
COMMENT ON COLUMN blog_tags.slug IS 'URL友好标识';
COMMENT ON COLUMN blog_tags.color IS '标签颜色';

COMMENT ON COLUMN blog_articles.article_id IS '文章唯一标识';
COMMENT ON COLUMN blog_articles.slug IS 'URL友好标识';
COMMENT ON COLUMN blog_articles.content IS 'Markdown原始内容';
COMMENT ON COLUMN blog_articles.html_content IS 'HTML渲染内容';
COMMENT ON COLUMN blog_articles.read_time IS '预估阅读时间（分钟）';

COMMENT ON COLUMN blog_comments.comment_id IS '评论唯一标识';
COMMENT ON COLUMN blog_comments.parent_id IS '父评论ID（支持回复）';
COMMENT ON COLUMN blog_comments.visitor_name IS '访客昵称';
COMMENT ON COLUMN blog_comments.visitor_email IS '访客邮箱（可选）';
COMMENT ON COLUMN blog_comments.visitor_website IS '访客网站（可选）';
COMMENT ON COLUMN blog_comments.status IS '评论状态：approved/pending/deleted';

-- 创建默认分类
INSERT INTO blog_categories (name, slug, description, sort_order) VALUES
('技术', 'tech', '技术相关文章', 1),
('生活', 'life', '生活感悟', 2),
('随笔', 'essay', '随笔杂记', 3)
ON CONFLICT (slug) DO NOTHING;

-- 创建默认标签
INSERT INTO blog_tags (name, slug, description, color) VALUES
('编程', 'programming', '编程相关', '#3B82F6'),
('JavaScript', 'javascript', 'JavaScript编程语言', '#F7DF1E'),
('Go', 'golang', 'Go编程语言', '#00ADD8'),
('前端', 'frontend', '前端开发', '#10B981'),
('后端', 'backend', '后端开发', '#F59E0B')
ON CONFLICT (slug) DO NOTHING;

-- 创建全文搜索配置
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_ts_config WHERE cfgname = 'chinese') THEN
        CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);
        COMMENT ON TEXT SEARCH CONFIGURATION chinese IS '中文全文搜索配置';
    END IF;
END $$;