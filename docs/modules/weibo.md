# 微博模块（Weibo Module）

## 模块预期实现的目标

实现类似微博的动态发布和管理系统，支持文字、图片、视频等多媒体内容发布。通过快照机制记录编辑历史，支持地理位置信息记录和设备信息采集，提供公开/私有可见性控制。该模块适用于个人动态分享、生活记录、思想表达等场景，为用户提供完整的社交媒体体验。

## 模块预期的功能点

### 1. 动态发布管理
- **内容发布**：支持文字、图片、视频、文件等多媒体内容发布
- **富文本编辑**：支持文本格式化、表情符号、话题标签等功能
- **多媒体上传**：支持多图片上传、视频文件上传和预览
- **发布时机控制**：支持立即发布、定时发布、草稿保存等功能

### 2. 编辑历史管理
- **快照机制**：每次编辑自动生成内容快照，完整记录编辑历史
- **版本对比**：支持不同版本间内容对比和差异显示
- **版本回滚**：支持回滚到任意历史版本
- **编辑统计**：记录编辑次数、编辑时间等信息

### 3. 位置和设备信息
- **地理位置**：支持手动选择或自动获取地理位置信息
- **设备信息**：自动记录发布设备型号、操作系统等信息
- **IP地址**：记录发布时的IP地址，用于安全分析
- **环境信息**：记录网络环境、浏览器等上下文信息

### 4. 可见性控制
- **公开范围**：支持公开、好友可见、私密等不同可见性设置
- **评论权限**：控制是否允许评论和互动
- **分享控制**：控制内容是否允许被分享
- **时间限制**：支持内容的临时可见性设置

## 数据流向与处理逻辑

### 1. 动态发布流程
```
用户编辑内容 → 保存草稿 → 提交发布
                    ↓
内容验证 → 多媒体处理 → 生成快照 → 存储主记录
                    ↓
处理附件 → 更新资产表 → 更新索引 → 推送通知
                    ↓
返回发布结果 → 更新缓存 → 记录操作日志
```

### 2. 编辑更新流程
```
用户编辑内容 → 创建编辑快照 → 验证内容格式
                    ↓
更新主记录 → 处理附件变更 → 更新资产关联
                    ↓
更新索引 → 清理相关缓存 → 发送更新通知
                    ↓
返回更新结果 → 记录编辑历史 → 更新时间戳
```

### 3. 快照管理流程
```
检测内容变更 → 创建版本快照 → 序列化内容
                    ↓
存储快照数据 → 更新版本号 → 记录变更信息
                    ↓
关联原始记录 → 设置快照时间 → 更新元数据
                    ↓
清理过期快照 → 维护快照数量 → 完成快照创建
```

## 重点代码设计逻辑

### 1. 动态发布核心逻辑
```pseudocode
PROCEDURE CreatePost(content, assets, visibility, location)
    TRY:
        步骤1: 验证内容格式和长度限制
        步骤2: 处理上传的媒体文件
        步骤3: 验证地理位置和设备信息
        步骤4: 开始数据库事务
        步骤5: 创建主动态记录
        步骤6: 创建初始快照
        步骤7: 处理资产关联关系
        步骤8: 提交事务
        步骤9: 更新搜索索引
        步骤10: 发送发布通知
        返回动态ID和发布结果
    CATCH 内容验证异常:
        返回内容格式错误
    CATCH 文件处理异常:
        记录错误，允许纯文本发布
    CATCH 数据库异常:
        回滚事务，返回发布失败
    END PROCEDURE
```

### 2. 快照生成逻辑
```pseudocode
PROCEDURE CreateSnapshot(postId, newContent, operator)
    TRY:
        步骤1: 获取当前动态记录作为基准
        步骤2: 生成新的版本号（当前版本+1）
        步骤3: 序列化完整内容数据
        步骤4: 提取关键变更字段
        步骤5: 记录变更操作信息
        步骤6: 存储快照记录
        步骤7: 更新主记录的最后快照时间
        步骤8: 检查快照数量限制
        步骤9: 清理过期快照
        返回快照ID
    CATCH 序列化异常:
        记录错误，使用基础快照格式
    CATCH 存储异常:
        返回快照创建失败
    END PROCEDURE
```

### 3. 资产处理逻辑
```pseudocode
PROCEDURE ProcessAssets(postId, assetList)
    TRY:
        步骤1: 验证资产文件类型和大小
        步骤2: 上传并存储文件内容
        步骤3: 生成资产唯一标识
        步骤4: 确定资产类型（图片/视频/文件）
        步骤5: 提取资产元数据（尺寸、时长等）
        步骤6: 按类型存储资产信息
        步骤7: 建立与动态的关联关系
        步骤8: 设置显示顺序
        返回资产处理结果
    CATCH 文件验证异常:
        跳过无效文件，继续处理其他资产
    CATCH 存储异常:
        记录错误，不影响动态发布
    END PROCEDURE
```

### 4. 地理位置处理逻辑
```pseudocode
PROCEDURE ProcessLocation(locationData)
    步骤1: 验证坐标数据有效性
    步骤2: 调用地理编码API获取地址信息
    步骤3: 解析国家和城市信息
    步骤4: 标准化地点名称格式
    步骤5: 缓存地理位置信息
    步骤6: 返回结构化位置数据
END PROCEDURE

PROCEDURE ExtractDevice()
    步骤1: 获取User-Agent字符串
    步骤2: 解析浏览器和版本信息
    步骤3: 识别操作系统和版本
    步骤4: 判断设备类型（mobile/desktop）
    步骤5: 提取屏幕分辨率信息
    步骤6: 返回设备信息结构
END PROCEDURE
```

### 5. 可见性控制逻辑
```pseudocode
PROCEDURE CheckVisibility(post, viewerId)
    步骤1: 获取动态可见性设置
    SWITCH post.visibility
        CASE "public":
            返回可见性为真
        CASE "private":
            IF viewerId == post.authorId THEN
                返回可见性为真
            ELSE
                返回可见性为假
            END IF
        CASE "friends":
            IF IsFriend(viewerId, post.authorId) THEN
                返回可见性为真
            ELSE
                返回可见性为假
            END IF
        DEFAULT:
            返回可见性为假
    END SWITCH
END PROCEDURE
```

### 6. 删除操作逻辑
```pseudocode
PROCEDURE DeletePost(postId, operatorId)
    TRY:
        步骤1: 验证操作权限（作者或管理员）
        步骤2: 检查动态是否存在
        步骤3: 创建删除前快照
        步骤4: 标记主记录为已删除
        步骤5: 更新删除时间戳
        步骤6: 清理相关缓存
        步骤7: 发送删除通知
        返回删除成功状态
    CATCH 权限异常:
        返回权限不足错误
    CATCH 记录不存在异常:
        返回动态不存在错误
    END PROCEDURE
```

## 模块功能使用方式

### 1. 前端界面集成
- **调用入口**：WeiboPost组件作为主要发布界面
- **参数传递格式**：通过表单提交内容、资产、可见性等信息
- **交互反馈机制**：实时字数统计、上传进度显示、发布状态提示

### 2. 后端接口调用
- **服务初始化方式**：通过GoFrame依赖注入自动初始化WeiboService
- **API签名示例**：
  ```go
  // 创建动态
  weiboService.CreatePost(ctx, &weibo.CreatePostReq{
      Content: "动态内容",
      Visibility: "public",
      Location: &weibo.LocationInfo{},
      Assets: []weibo.AssetInfo{},
  })

  // 获取动态列表
  weiboService.GetPosts(ctx, &weibo.GetPostsReq{
      Page: 1,
      PageSize: 20,
      Filter: weibo.FilterOptions{},
  })

  // 获取快照历史
  weiboService.GetSnapshots(ctx, postId)
  ```
- **异步处理约定**：大文件上传使用异步处理，返回任务ID和进度查询接口

### 3. 组件使用示例
```typescript
// 发布动态组件
<WeiboEditor
  onSave={handleSave}
  onCancel={handleCancel}
  initialContent={editContent}
  allowAttachments={true}
  enableLocation={true}
/>

// 动态列表组件
<WeiboList
  loadMore={loadMore}
  onItemClick={handleItemClick}
  filterOptions={filter}
  pagination={pagination}
/>
```

## 第三方组件与数据库设计

### 1. 第三方组件
| 组件名称 | 版本 | 在模块中的具体作用 |
|---------|------|------------------|
| GoFrame | v2.9.3 | Web框架，提供路由、中间件、ORM等功能 |
| PostgreSQL | 18 | 主数据库，存储动态内容和用户数据 |
| 地理编码API | 可选 | 提供地理位置信息转换服务 |
| Arco Design | 2.66.5 | 前端UI组件库，提供编辑器、上传等组件 |
| 图片处理库 | 可选 | 图片压缩和缩略图生成 |

### 2. 数据库设计
#### 主动态表：weibo_posts
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| post_id | UUID | UNIQUE NOT NULL | 动态唯一标识 |
| content | TEXT | NOT NULL | 动态文本内容 |
| html_content | TEXT | | HTML格式内容 |
| author_id | BIGINT | NOT NULL | 作者ID |
| visibility | VARCHAR(20) | DEFAULT 'public' | 可见性设置 |
| allow_comment | BOOLEAN | DEFAULT true | 是否允许评论 |
| allow_share | BOOLEAN | DEFAULT true | 是否允许分享 |
| is_top | BOOLEAN | DEFAULT false | 是否置顶 |
| is_deleted | BOOLEAN | DEFAULT false | 是否已删除 |
| like_count | INTEGER | DEFAULT 0 | 点赞数 |
| comment_count | INTEGER | DEFAULT 0 | 评论数 |
| share_count | INTEGER | DEFAULT 0 | 分享数 |
| view_count | INTEGER | DEFAULT 0 | 查看数 |
| latitude | NUMERIC(10,6) | | 纬度 |
| longitude | NUMERIC(10,6) | | 经度 |
| location_name | VARCHAR(200) | | 位置名称 |
| device_info | JSONB | | 设备信息 |
| ip_address | INET | | IP地址 |
| user_agent | TEXT | | 用户代理 |
| extra_metadata | JSONB | | 扩展元数据 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMPTZ | | 删除时间 |

#### 资产表：weibo_assets
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| asset_id | UUID | UNIQUE NOT NULL | 资产唯一标识 |
| post_id | BIGINT | REFERENCES weibo_posts(id) | 关联动态ID |
| file_id | BIGINT | REFERENCES files(id) | 关联文件ID |
| asset_type | VARCHAR(20) | NOT NULL | 资产类型 |
| asset_name | VARCHAR(255) | | 资产文件名 |
| mime_type | VARCHAR(255) | | MIME类型 |
| file_size | BIGINT | | 文件大小 |
| width | INTEGER | | 图片宽度 |
| height | INTEGER | | 图片高度 |
| duration | INTEGER | | 视频/音频时长 |
| thumbnail_id | UUID | | 缩略图ID |
| sort_order | INTEGER | DEFAULT 0 | 显示顺序 |
| is_cover | BOOLEAN | DEFAULT false | 是否为封面 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

#### 快照表：weibo_snapshots
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| snapshot_id | UUID | UNIQUE NOT NULL | 快照唯一标识 |
| post_id | BIGINT | REFERENCES weibo_posts(id) | 关联动态ID |
| version | INTEGER | NOT NULL | 版本号 |
| content | TEXT | NOT NULL | 内容快照 |
| html_content | TEXT | | HTML内容快照 |
| visibility | VARCHAR(20) | | 可见性快照 |
| change_type | VARCHAR(20) | NOT NULL | 变更类型 |
| change_summary | TEXT | | 变更摘要 |
| diff_data | JSONB | | 差异数据 |
| operator_id | BIGINT | | 操作者ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

#### 互动表：weibo_interactions
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| interaction_id | UUID | UNIQUE NOT NULL | 互动唯一标识 |
| post_id | BIGINT | REFERENCES weibo_posts(id) | 关联动态ID |
| user_id | BIGINT | | 用户ID |
| interaction_type | VARCHAR(20) | NOT NULL | 互动类型 |
| target_user_id | BIGINT | | 目标用户ID |
| content | TEXT | | 互动内容 |
| metadata | JSONB | | 扩展元数据 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

### 3. 索引设计
- `idx_weibo_posts_author_id`：作者ID索引，用于用户动态查询
- `idx_weibo_posts_created_at`：创建时间索引，用于时间排序
- `idx_weibo_posts_visibility`：可见性索引，用于权限过滤
- `idx_weibo_posts_deleted_at`：删除时间索引，用于软删除查询
- `idx_weibo_assets_post_id`：关联动态ID索引，用于资产查询
- `idx_weibo_snapshots_post_id`：关联动态ID索引，用于快照查询
- `idx_weibo_interactions_post_id`：关联动态ID索引，用于互动查询

### 4. 数据结构定义
```go
type WeiboPost struct {
    ID            int64                  `json:"id"`
    PostID        string                 `json:"postId"`
    Content       string                 `json:"content"`
    HTMLContent   string                 `json:"htmlContent"`
    AuthorID      int64                  `json:"authorId"`
    Visibility    string                 `json:"visibility"`
    AllowComment  bool                   `json:"allowComment"`
    AllowShare    bool                   `json:"allowShare"`
    IsTop         bool                   `json:"isTop"`
    IsDeleted     bool                   `json:"isDeleted"`
    LikeCount     int                    `json:"likeCount"`
    CommentCount  int                    `json:"commentCount"`
    ShareCount    int                    `json:"shareCount"`
    ViewCount     int                    `json:"viewCount"`
    Location      *LocationInfo          `json:"location"`
    DeviceInfo    *DeviceInfo            `json:"deviceInfo"`
    IPAddress     string                 `json:"ipAddress"`
    UserAgent     string                 `json:"userAgent"`
    ExtraMeta     map[string]interface{} `json:"extraMeta"`
    CreatedAt     time.Time             `json:"createdAt"`
    UpdatedAt     time.Time             `json:"updatedAt"`
    DeletedAt     *time.Time            `json:"deletedAt"`
}

type LocationInfo struct {
    Latitude    float64 `json:"latitude"`
    Longitude   float64 `json:"longitude"`
    City        string  `json:"city"`
    Country     string  `json:"country"`
    Address     string  `json:"address"`
    Description string  `json:"description"`
}

type DeviceInfo struct {
    Type        string `json:"type"`
    Browser     string `json:"browser"`
    Version     string `json:"version"`
    OS          string `json:"os"`
    OSVersion   string `json:"osVersion"`
    Screen      string `json:"screen"`
    Language    string `json:"language"`
    Platform    string `json:"platform"`
}

type AssetInfo struct {
    AssetID     string `json:"assetId"`
    Type        string `json:"type"`
    Name        string `json:"name"`
    MimeType    string `json:"mimeType"`
    Size        int64  `json:"size"`
    Width       int    `json:"width"`
    Height      int    `json:"height"`
    Duration    int    `json:"duration"`
    ThumbnailID string `json:"thumbnailId"`
    SortOrder   int    `json:"sortOrder"`
    IsCover     bool   `json:"isCover"`
}

type SnapshotInfo struct {
    SnapshotID    string      `json:"snapshotId"`
    Version       int         `json:"version"`
    Content       string      `json:"content"`
    HTMLContent   string      `json:"htmlContent"`
    Visibility    string      `json:"visibility"`
    ChangeType    string      `json:"changeType"`
    ChangeSummary string      `json:"changeSummary"`
    DiffData      interface{} `json:"diffData"`
    OperatorID    int64       `json:"operatorId"`
    CreatedAt     time.Time   `json:"createdAt"`
}
```

### 5. 配置选项结构
```typescript
interface WeiboEditorConfig {
  maxContentLength: number;     // 最大内容长度
  maxImageCount: number;         // 最大图片数量
  maxFileSize: number;          // 最大文件大小
  allowedImageTypes: string[];   // 允许的图片类型
  allowedVideoTypes: string[];   // 允许的视频类型
  enableLocation: boolean;       // 启用地理位置
  enableRichText: boolean;       // 启用富文本编辑
  autoSave: boolean;            // 自动保存草稿
  snapshotInterval: number;      // 快照间隔（秒）
  maxSnapshots: number;          // 最大快照数量
}
```

### 6. 可见性枚举定义
```go
type PostVisibility string

const (
    VisibilityPublic  PostVisibility = "public"   // 公开
    VisibilityPrivate PostVisibility = "private"  // 私密
    VisibilityFriends PostVisibility = "friends"  // 好友可见
    VisibilityCustom  PostVisibility = "custom"   // 自定义
)
```

## 数据库设计模式

### 1. 快照版本控制模式

**完整快照存储**：
```sql
-- 微博快照表设计
CREATE TABLE weibo_snapshots (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES weibo_posts(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,                    -- 递增版本号
    content TEXT NOT NULL,                       -- 完整内容快照
    snapshot_visibility TEXT NOT NULL,            -- 可见性快照
    snapshot_meta JSONB,                         -- 快照元数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_weibo_snapshots_post_version UNIQUE (post_id, version)
);
```

**变更追踪机制**：
- 每次编辑创建完整快照，不存储差异数据
- `version` 字段实现线性版本控制
- `change_type` 记录操作类型（create/update/delete）
- 支持版本回滚和对比功能

### 2. 资产关联管理模式

**多媒体资产分类存储**：
```sql
-- 资产表设计（支持多种媒体类型）
CREATE TABLE weibo_assets (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT REFERENCES weibo_posts(id) ON DELETE CASCADE,
    file_id BIGINT NOT NULL,                     -- 关联文件系统
    kind TEXT NOT NULL CHECK (kind IN ('image','attachment')),
    sort_order INTEGER DEFAULT 0,                -- 显示顺序
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 外键约束引用文件系统
ALTER TABLE weibo_assets
  ADD CONSTRAINT fk_weibo_assets_file_id
    FOREIGN KEY (file_id) REFERENCES files (id) ON DELETE RESTRICT;
```

**跨模块集成设计**：
- 通过 `file_id` 关联文件管理系统
- 支持图片和附件两种类型分类
- `ON DELETE RESTRICT` 确保文件安全性

### 3. 地理位置设备信息模式

**结构化位置存储**：
```sql
-- 地理位置和设备信息字段
lat NUMERIC(10,6),                           -- 纬度（精确到米）
lng NUMERIC(10,6),                           -- 经度（精确到米）
city VARCHAR(128),                            -- 城市信息
device VARCHAR(256),                          -- 设备信息
ip VARCHAR(64),                              -- IP地址
extra JSONB                                  -- 扩展元数据

-- 地理坐标约束
CONSTRAINT chk_lat_range CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90)),
CONSTRAINT chk_lng_range CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180))
```

**设备信息采集**：
- 自动记录User-Agent字符串
- IP地址用于安全分析
- JSONB字段存储扩展设备信息

### 4. 可见性权限控制模式

**分层权限设计**：
```sql
-- 可见性字段和约束
visibility TEXT NOT NULL DEFAULT 'public'
CHECK (visibility IN ('public','private')),

-- 软删除标记
is_deleted BOOLEAN NOT NULL DEFAULT false
```

**权限控制逻辑**：
- `public`：所有人可见
- `private`：仅自己可见（预留权限扩展）
- 软删除机制支持数据恢复

### 5. 复合索引优化模式

**多维度查询索引**：
```sql
-- 基础索引
CREATE INDEX idx_weibo_posts_created_at_desc ON weibo_posts (created_at DESC);
CREATE INDEX idx_weibo_posts_visibility ON weibo_posts (visibility);
CREATE INDEX idx_weibo_posts_author_id ON weibo_posts (author_id);

-- 条件索引（仅查询未删除记录）
CREATE INDEX idx_weibo_posts_not_deleted_created_desc
ON weibo_posts (created_at DESC) WHERE is_deleted = false;

-- 复合索引
CREATE INDEX idx_weibo_assets_post_id_kind ON weibo_posts (post_id, kind);
CREATE INDEX idx_weibo_assets_post_id_sort ON weibo_posts (post_id, sort_order);
```

**性能优化策略**：
- 条件索引减少已删除数据查询
- 复合索引支持多条件筛选
- 时间降序索引优化时间线查询

### 6. 自动化触发器模式

**更新时间自动维护**：
```sql
-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为微博表创建触发器
CREATE TRIGGER t_weibo_posts_updated_at
BEFORE UPDATE ON weibo_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 7. 扩展元数据存储模式

**JSONB扩展字段**：
```sql
-- 扩展元数据存储
extra JSONB,                                   -- 微博扩展数据
snapshot_meta JSONB,                          -- 快照元数据

-- GIN索引支持JSONB查询
CREATE INDEX idx_weibo_posts_extra_gin ON weibo_posts USING GIN(extra);
```

**灵活扩展设计**：
- 支持任意扩展字段存储
- JSONB类型支持高效查询
- GIN索引优化JSONB检索性能

### 8. 级联删除安全模式

**级联删除设计**：
```sql
-- 快照表级联删除
CREATE TABLE weibo_snapshots (
    post_id BIGINT REFERENCES weibo_posts(id) ON DELETE CASCADE
);

-- 资产表级联删除
CREATE TABLE weibo_assets (
    post_id BIGINT REFERENCES weibo_posts(id) ON DELETE CASCADE
);
```

**数据一致性保障**：
- 主记录删除时自动清理关联数据
- 避免孤儿数据产生
- 维护数据库完整性

### 9. 唯一约束防重复模式

**业务唯一性约束**：
```sql
-- 快照版本唯一性
CONSTRAINT uk_weibo_snapshots_post_version UNIQUE (post_id, version)
```

**数据完整性保障**：
- 防止同一版本重复快照
- 确保版本号唯一性
- 维护业务逻辑一致性

### 10. 预留扩展模式

**权限系统扩展预留**：
- `visibility` 字段支持更多权限级别
- `author_id` 预留多用户系统关联
- `extra` 字段支持权限扩展配置

**互动功能预留**：
- 预留点赞、评论、分享统计字段
- 支持后续互动模块集成
- JSONB字段支持复杂互动数据

**搜索功能预留**：
- JSONB扩展字段支持搜索标签
- 地理位置字段支持地域搜索
- 设备信息支持行为分析

**内容审核预留**：
- `is_deleted` 字段可扩展为内容状态
- 支持审核状态、敏感词过滤等
- JSONB字段支持审核元数据