# 数据库

## 数据库选型

选用关系型数据库 PostgreSQL，版本号为 18.0
测试环境中的参数如下

````json
{
    "PG_HOST": "127.0.0.1",
    "PG_PORT": "5432",
    "PG_USER": "admin",
    "PG_PASSWORD": "123456",
    "PG_DATABASE": "JieCool"
}
````

## 连接与配置（后端 GoFrame）

后端连接串在 `server/manifest/config/config.yaml` 中配置。默认模板使用 MySQL 示例，请替换为 PostgreSQL：

```yaml
database:
  default:
    # 连接串格式：pgsql:<user>:<pass>@tcp(<host>:<port>)/<database>
    link: "pgsql:admin:123456@tcp(127.0.0.1:5432)/JieCool"
```

说明与建议：
- 开发环境建议使用本地或 Docker 启动 PostgreSQL 18，确保端口与权限一致。
- 生产环境请通过环境变量注入敏感信息（用户名、密码），避免明文配置入库。

## 迁移与种子数据（规划）

为保持各环境一致性，采用 SQL 迁移文件管理版本，示例目录如下：

```
db/
├── migrations/
│   ├── 0001_init_users.sql
│   ├── 0002_init_profiles.sql
│   └── 0003_init_misc.sql
└── seeds/
    └── dev/
        ├── users.sql
        └── profiles.sql
```

执行策略（Windows PowerShell 示例，后续将提供脚本）：
- 迁移执行：按文件名编号顺序执行 `db/migrations/*.sql`。
- 种子数据：在开发环境执行 `db/seeds/dev/*.sql`，便于联调。

命名规范：
- 迁移文件采用 4 位编号 + 描述（例如 `0001_init_users.sql`），避免冲突。
- 在迁移中明确索引、外键与约束的设计意图，并添加必要注释。

## 访问记录表（logs_visit_access）

用于持久化接口访问记录（由后端 Visit 接口写入，API 路径前缀为 `/logs`）。

DDL 示例：

```sql
CREATE TABLE IF NOT EXISTS logs_visit_access (
    id BIGSERIAL PRIMARY KEY,
    time TIMESTAMPTZ NOT NULL,
    ip TEXT,
    user_agent TEXT,
    method TEXT,
    path TEXT,
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

字段说明：
- time：访问时间（timestamptz）
- ip：客户端 IP（来源于 r.GetClientIp 或降级）
- user_agent：请求 UA
- method：HTTP 方法
- path：请求路径
- headers：请求头的首值扁平化集合（jsonb）
- created_at：记录创建时间

后端写入策略：
- 优先写入 PostgreSQL（g.DB().Model("logs_visit_access").Insert）。
- 数据库不可用时降级写入 data/visit.log（JSON Lines）。

MCP 执行：
- 可通过 MCP PostgreSQL 执行 DDL 与数据查询，便于在开发环境快速初始化。

## 文件管理表（files）

用于存储上传的文件及其元数据，支持二进制文件存储和完整性校验。

DDL 定义：

```sql
CREATE TABLE IF NOT EXISTS files (
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
    file_md5 VARCHAR(32),                       -- MD5哈希值，用于文件完整性校验
    
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
```

字段说明：
- id：主键ID，自增
- file_uuid：文件唯一标识符，UUID格式，用于外部访问
- file_name：原始文件名
- file_extension：文件扩展名（不含点号）
- file_size：文件大小（字节）
- mime_type：MIME类型
- file_content：文件二进制内容（BYTEA类型）
- file_hash：SHA256哈希值，用于去重和完整性校验
- file_md5：MD5哈希值，用于文件完整性校验
- has_thumbnail：是否有缩略图
- thumbnail_content：缩略图二进制内容
- thumbnail_width/height：缩略图尺寸
- download_count：下载次数
- last_download_at：最近一次下载时间
- metadata：文件元数据（JSONB格式）
- file_status：文件状态（active/deleted/archived）
- file_category：文件分类
- uploader_*：上传者相关信息
- created_at/updated_at：时间戳

索引设计：
- 主键索引：id
- 唯一索引：file_uuid
- 普通索引：file_hash, file_extension, file_category, file_status, created_at, download_count, file_md5
- 复合索引：(file_status, file_category), (file_extension, file_status)
- GIN索引：metadata（用于JSONB查询）

## 文件下载日志表（file_download_logs）

用于记录详细的文件下载统计信息，支持下载行为分析。

DDL 定义：

```sql
CREATE TABLE IF NOT EXISTS file_download_logs (
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
```

字段说明：
- id：主键ID，自增
- file_id：关联的文件ID（外键）
- file_uuid：文件UUID（冗余存储，便于查询）
- download_ip：下载者IP地址
- download_user_agent：下载者User-Agent
- download_referer：下载来源页面
- download_size：实际下载大小
- download_status：下载状态（success/failed/partial）
- download_time：下载时间

索引设计：
- 主键索引：id
- 普通索引：file_id, file_uuid, download_time, download_ip

数据库特性：
- 使用PostgreSQL 18的UUID生成功能
- 支持BYTEA二进制存储
- 使用JSONB存储元数据
- 自动更新时间戳触发器
- 外键约束确保数据一致性
