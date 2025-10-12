-- 微博模块初始化迁移脚本
-- 创建时间: 2025-10-11
-- 描述: 新增微博主表、资产表、快照表及相关索引与触发器

BEGIN;

-- 1) 主表：weibo_posts（微博内容与元信息）
CREATE TABLE IF NOT EXISTS weibo_posts (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_id BIGINT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  lat NUMERIC(10,6),
  lng NUMERIC(10,6),
  city VARCHAR(128),
  device VARCHAR(256),
  ip VARCHAR(64),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  extra JSONB,
  CONSTRAINT chk_lat_range CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90)),
  CONSTRAINT chk_lng_range CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180))
);

COMMENT ON TABLE weibo_posts IS '微博主表：内容/时间/位置/设备/IP/可见性/扩展';
COMMENT ON COLUMN weibo_posts.visibility IS 'public: 公开，private: 登录可见（权限预留）';

-- 触发器函数：更新 updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器：更新前刷新 updated_at
DROP TRIGGER IF EXISTS t_weibo_posts_updated_at ON weibo_posts;
CREATE TRIGGER t_weibo_posts_updated_at
BEFORE UPDATE ON weibo_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 索引
CREATE INDEX IF NOT EXISTS idx_weibo_posts_created_at_desc ON weibo_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weibo_posts_visibility ON weibo_posts (visibility);
CREATE INDEX IF NOT EXISTS idx_weibo_posts_author_id ON weibo_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_weibo_posts_not_deleted_created_desc ON weibo_posts (created_at DESC) WHERE is_deleted = false;

-- 2) 资产表：weibo_assets（图片/附件关联）
CREATE TABLE IF NOT EXISTS weibo_assets (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES weibo_posts(id) ON DELETE CASCADE,
  file_id BIGINT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image','attachment')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE weibo_assets IS '微博资产表：图片/附件与文件系统关联';
COMMENT ON COLUMN weibo_assets.file_id IS '引用文件系统中的文件主键/唯一ID（与 files.id 对应）';

-- 外键：引用文件系统
ALTER TABLE weibo_assets
  DROP CONSTRAINT IF EXISTS fk_weibo_assets_file_id,
  ADD CONSTRAINT fk_weibo_assets_file_id
    FOREIGN KEY (file_id)
    REFERENCES files (id)
    ON DELETE RESTRICT;

-- 索引
CREATE INDEX IF NOT EXISTS idx_weibo_assets_post_id_kind ON weibo_assets (post_id, kind);
CREATE INDEX IF NOT EXISTS idx_weibo_assets_post_id_sort ON weibo_assets (post_id, sort_order);

-- 3) 快照表：weibo_snapshots（编辑历史）
CREATE TABLE IF NOT EXISTS weibo_snapshots (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES weibo_posts(id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot_content TEXT,
  snapshot_visibility TEXT NOT NULL CHECK (snapshot_visibility IN ('public','private')),
  snapshot_meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uk_weibo_snapshots_post_version UNIQUE (post_id, version)
);

COMMENT ON TABLE weibo_snapshots IS '微博快照表：记录每次编辑的历史版本';

-- 索引
CREATE INDEX IF NOT EXISTS idx_weibo_snapshots_post_id_version ON weibo_snapshots (post_id, version);
CREATE INDEX IF NOT EXISTS idx_weibo_snapshots_created_at_desc ON weibo_snapshots (created_at DESC);

COMMIT;