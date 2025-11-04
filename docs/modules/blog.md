# 博客模块（Blog Module）

## 模块预期实现的目标

实现一个功能完整的博客系统，支持Markdown文章的创建、编辑、发布和管理。与微博模块不同，博客模块专注于长篇内容创作，支持富文本编辑、标签分类、SEO优化、评论互动等功能。前端提供专业的Markdown编辑器和渲染引擎，后端支持版本控制、草稿管理、定时发布等高级功能。该模块适用于个人博客、技术文章、教程分享等内容创作场景。

## 模块预期的功能点

### 1. 文章创作管理
- **Markdown编辑器**：支持实时预览、语法高亮、快捷键操作
- **富文本增强**：支持图片插入、表格编辑、代码块语法高亮
- **草稿系统**：自动保存草稿、手动保存、草稿恢复功能
- **定时发布**：支持设定发布时间、立即发布、保存为草稿
- **模板系统**：提供文章模板、快速开始、内容片段库

### 2. 文章组织管理
- **分类体系**：支持多级分类、标签系统、文章系列
- **搜索功能**：全文搜索、标签搜索、分类筛选
- **归档系统**：按时间归档、按分类归档、按标签归档
- **文章状态**：草稿、已发布、私密、置顶等多种状态
- **批量操作**：批量修改状态、批量删除、批量归类

### 3. 内容版本控制
- **版本历史**：每次编辑自动保存版本，支持版本对比
- **回滚功能**：支持回滚到任意历史版本
- **差异显示**：可视化显示版本间的文本差异
- **协作编辑**：支持多人协作编辑和评论（可选）
- **变更日志**：记录所有编辑操作和变更内容

### 4. SEO优化功能
- **元数据管理**：自定义标题、描述、关键词
- **URL优化**：自定义文章URL（slug）、生成友好链接
- **结构化数据**：支持JSON-LD、Open Graph、Twitter Cards
- **搜索引擎提交**：自动生成sitemap.xml、支持搜索引擎提交
- **统计分析**：页面访问统计、关键词分析、来源追踪

### 5. 互动功能（简化版）
- **评论系统**：支持匿名评论、Markdown评论、简单审核（仅删除违规评论）
- **分享功能**：社交媒体分享、链接复制
- **订阅功能**：RSS订阅
- **访问统计**：页面浏览次数统计

### 6. 权限管理（个人博客简化版）
- **博主权限**：文章创建、编辑、删除、发布、评论管理权限
- **访问控制**：公开文章、私密文章（仅自己可见）
- **评论管理**：删除违规评论、回复评论

## 数据流向与处理逻辑

### 1. 文章发布流程
```
用户编写内容 → 自动保存草稿 → 内容验证 → 提交发布
                    ↓
Markdown解析 → 生成HTML → 提取元数据 → 存储文章
                    ↓
处理图片附件 → 生成缩略图 → 更新分类标签 → 发送通知
                    ↓
更新搜索索引 → 生成RSS → 更新缓存 → 返回发布结果
```

### 2. 内容编辑流程
```
打开编辑器 → 加载文章内容 → 开始编辑
                    ↓
实时预览更新 → 自动保存版本 → 检测内容变更
                    ↓
保存编辑内容 → 解析Markdown → 生成HTML预览
                    ↓
更新数据库 → 清理缓存 → 更新搜索索引 → 完成编辑
```

### 3. 评论处理流程（简化版）
```
用户提交评论 → 基础验证 → 过滤敏感词 → 存储评论
                    ↓
更新文章评论数 → 直接显示评论 → 完成流程
```

### 4. 搜索索引流程
```
内容变更触发 → 提取文章内容 → 生成搜索索引
                    ↓
分词处理 → 建立倒排索引 → 更新索引库
                    ↓
优化搜索性能 → 缓存热门搜索 → 定期重建索引
```

## 重点代码设计逻辑

### 1. Markdown处理核心逻辑
```pseudocode
PROCEDURE ProcessMarkdownContent(rawContent)
    TRY:
        步骤1: 验证Markdown格式有效性
        步骤2: 解析Markdown语法结构
        步骤3: 提取标题层级结构（H1-H6）
        步骤4: 处理代码块语法高亮
        步骤5: 处理图片链接和附件引用
        步骤6: 生成HTML渲染结果
        步骤7: 提取文章目录（TOC）
        步骤8: 处理内部锚点链接
        步骤骤9: 生成摘要信息
        返回处理结果
    CATCH 解析异常:
        记录错误日志，使用原始内容
    CATCH 渲染异常:
        返回基础HTML格式
    END PROCEDURE
```

### 2. 文章存储逻辑
```pseudocode
PROCEDURE CreateArticle(articleData, authorId)
    TRY:
        步骤1: 验证文章内容完整性
        步骤2: 处理文章标题和摘要
        步骤3: 生成文章唯一标识（slug）
        步骤4: 开始数据库事务
        步骤5: 创建文章主记录
        步骤6: 保存Markdown原始内容
        步骤7: 保存HTML渲染内容
        步骤8: 处理分类和标签关联
        步骤9: 设置发布状态和时间
        步骤10: 提交事务
        步骤11: 更新搜索索引
        步骤12: 生成RSS更新
        返回文章ID
    CATCH 数据验证异常:
        返回内容格式错误
    CATCH 数据库异常:
        回滚事务，返回发布失败
    END PROCEDURE
```

### 3. 版本控制逻辑
```pseudocode
PROCEDURE CreateArticleVersion(articleId, newContent, operatorId)
    TRY:
        步骤1: 获取当前文章内容作为基准
        步骤2: 比较内容差异，识别变更类型
        步骤3: 生成版本号（当前版本+1）
        步骤4: 创建版本记录
        步骤5: 保存完整内容快照
        步骤6: 记录变更摘要
        步骤7: 更新文章最后版本时间
        步骤8: 检查版本数量限制
        步骤9: 清理过期版本
        返回版本ID
    CATCH 内容比较异常:
        记录基础版本信息
    CATCH 存储异常:
        返回版本创建失败
    END PROCEDURE
```

### 4. SEO处理逻辑
```pseudocode
PROCEDURE GenerateSEOData(article)
    TRY:
        步骤1: 从内容中提取关键词
        步骤2: 生成文章描述摘要
        步骤3: 优化文章标题（SEO友好）
        步骤4: 生成URL别名（slug）
        步骤5: 创建Open Graph元数据
        步骤6: 生成Twitter Card元数据
        步骤7: 创建JSON-LD结构化数据
        步骤8: 生成Canonical URL
        步骤9: 更新搜索引擎提交信息
        返回SEO数据包
    END PROCEDURE
```

### 5. 评论处理逻辑（简化版）
```pseudocode
PROCEDURE ProcessComment(commentData, articleId, visitorInfo)
    TRY:
        步骤1: 基础内容验证（长度、格式）
        步骤2: 过滤敏感词和恶意内容
        步骤3: 处理Markdown格式评论
        步骤4: 生成评论唯一ID
        步骤5: 存储评论记录（包含访客信息）
        步骤6: 更新文章评论数
        返回评论ID
    CATCH 内容异常:
        返回内容格式错误
    END PROCEDURE
```

### 6. 搜索索引逻辑
```pseudocode
PROCEDURE UpdateSearchIndex(articleId)
    TRY:
        步骤1: 获取文章完整信息
        步骤2: 提取搜索关键词（标题、内容、标签）
        步骤3: 进行中文分词处理
        步骤4: 计算关键词权重
        步骤5: 建立倒排索引
        步骤6: 更新索引库
        步骤7: 优化索引性能
        返回索引更新结果
    CATCH 分词异常:
        使用基础关键词提取
    CATCH 索引异常:
        记录索引更新失败
    END PROCEDURE
```

## 模块功能使用方式

### 1. 前端界面集成
- **Markdown编辑器**：集成CodeMirror或Monaco Editor，支持实时预览
- **文章管理界面**：文章列表、分类管理、标签管理界面
- **参数传递格式**：通过表单或API提交文章数据
- **交互反馈机制**：自动保存提示、发布状态反馈、错误处理提示

### 2. 后端接口调用
- **服务初始化方式**：通过GoFrame依赖注入自动初始化BlogService
- **API签名示例**：
  ```go
  // 创建文章
  blogService.CreateArticle(ctx, &blog.CreateArticleReq{
      Title:       "文章标题",
      Content:     "# 文章内容\n文章正文...",
      Summary:     "文章摘要",
      CategoryID:   1,
      Tags:        []string{"技术", "编程"},
      Status:      "published",
      IsDraft:     false,
      PublishAt:   time.Now(),
      SEO: &blog.SEOData{
          Title:       "SEO标题",
          Description: "SEO描述",
          Keywords:    "关键词1,关键词2",
      },
  })

  // 获取文章列表
  blogService.GetArticles(ctx, &blog.GetArticlesReq{
      Page:        1,
      PageSize:    20,
      CategoryID:  1,
      Tags:        []string{"技术"},
      Status:      "published",
      Search:      "搜索关键词",
  })

  // 获取文章详情
  blogService.GetArticle(ctx, &blog.GetArticleReq{
      ArticleID:   articleId,
      IncrementView: true,
  })
  ```
- **异步处理约定**：大文件上传使用异步处理，返回任务ID

### 3. 组件使用示例
```typescript
// 博客列表页面（实际实现）
export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(false)

  const fetchArticles = async () => {
    const response = await blogApi.getArticles({
      page: currentPage,
      size: pageSize,
      status: 'published'
    })
    setArticles(response?.list || [])
  }

  // 渲染文章列表，支持搜索和分页
}

// 文章详情页面（实际实现）
export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const [article, setArticle] = useState<BlogArticle | null>(null)

  // 通过slug查找文章，支持Markdown渲染
  // 使用ReactMarkdown + remarkGfm + rehypeHighlight
}

// 文章编辑页面（实际实现）
export default function BlogEditPage({ params }: { params: { id: string } }) {
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    slug: ''
  })

  // 支持实时预览切换，完整Markdown渲染
  // 字数统计和阅读时间计算
}
```

## 第三方组件与数据库设计

### 1. 第三方组件
| 组件名称 | 版本 | 在模块中的具体作用 |
|---------|------|------------------|
| GoFrame | v2.9.3 | Web框架，提供路由、中间件、ORM等功能 |
| PostgreSQL | 18 | 主数据库，存储文章内容和用户数据 |
| react-markdown | 9.x | Markdown解析器，将Markdown转换为HTML |
| remark-gfm | 4.x | GitHub风格Markdown扩展支持（表格、任务列表等） |
| rehype-highlight | 7.x | 代码语法高亮，支持多种编程语言 |
| Arco Design | 2.66.5 | 前端UI组件库，提供表格、表单等组件 |
| Next.js | 14.2.15 | 前端框架，提供App Router和服务端渲染 |
| TypeScript | 5.x | 类型安全的JavaScript超集 |
| 图片处理库 | 可选 | 图片压缩和缩略图生成 |
| 搜索引擎 | 可选 | 中文分词和搜索索引 |

### 2. 数据库设计
#### 文章主表：blog_articles
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| article_id | UUID | UNIQUE NOT NULL | 文章唯一标识 |
| title | VARCHAR(255) | NOT NULL | 文章标题 |
| slug | VARCHAR(255) | UNIQUE NOT NULL | URL友好标识 |
| summary | TEXT | | 文章摘要 |
| content | TEXT | NOT NULL | Markdown原始内容 |
| html_content | TEXT | | HTML渲染内容 |
| author_id | BIGINT | NOT NULL | 作者ID |
| category_id | BIGINT | REFERENCES blog_categories(id) | 分类ID |
| status | VARCHAR(20) | DEFAULT 'draft' | 文章状态 |
| is_draft | BOOLEAN | DEFAULT true | 是否为草稿 |
| is_top | BOOLEAN | DEFAULT false | 是否置顶 |
| is_private | BOOLEAN | DEFAULT false | 是否私密 |
| view_count | INTEGER | DEFAULT 0 | 浏览次数 |
| like_count | INTEGER | DEFAULT 0 | 点赞数 |
| comment_count | INTEGER | DEFAULT 0 | 评论数 |
| share_count | INTEGER | DEFAULT 0 | 分享数 |
| featured_image | VARCHAR(255) | | 特色图片URL |
| read_time | INTEGER | DEFAULT 0 | 预估阅读时间（分钟） |
| publish_at | TIMESTAMPTZ | | 发布时间 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |
| deleted_at | TIMESTAMPTZ | | 删除时间 |

#### 分类表：blog_categories
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| category_id | UUID | UNIQUE NOT NULL | 分类唯一标识 |
| name | VARCHAR(100) | NOT NULL | 分类名称 |
| slug | VARCHAR(100) | UNIQUE NOT NULL | URL友好标识 |
| description | TEXT | | 分类描述 |
| parent_id | BIGINT | REFERENCES blog_categories(id) | 父分类ID |
| sort_order | INTEGER | DEFAULT 0 | 排序顺序 |
| article_count | INTEGER | DEFAULT 0 | 文章数量 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

#### 标签表：blog_tags
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| tag_id | UUID | UNIQUE NOT NULL | 标签唯一标识 |
| name | VARCHAR(50) | NOT NULL | 标签名称 |
| slug | VARCHAR(50) | UNIQUE NOT NULL | URL友好标识 |
| description | TEXT | | 标签描述 |
| color | VARCHAR(7) | | 标签颜色 |
| article_count | INTEGER | DEFAULT 0 | 文章数量 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

#### 文章标签关联表：blog_article_tags
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| article_id | BIGINT | REFERENCES blog_articles(id) | 文章ID |
| tag_id | BIGINT | REFERENCES blog_tags(id) | 标签ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

#### 文章版本表：blog_article_versions
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| version_id | UUID | UNIQUE NOT NULL | 版本唯一标识 |
| article_id | BIGINT | REFERENCES blog_articles(id) | 文章ID |
| version | INTEGER | NOT NULL | 版本号 |
| title | VARCHAR(255) | NOT NULL | 版本标题 |
| content | TEXT | NOT NULL | 版本内容 |
| html_content | TEXT | | HTML内容 |
| summary | TEXT | | 版本摘要 |
| change_type | VARCHAR(20) | NOT NULL | 变更类型 |
| change_summary | TEXT | | 变更摘要 |
| diff_data | JSONB | | 差异数据 |
| operator_id | BIGINT | | 操作者ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

#### 评论表：blog_comments（简化版）
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| comment_id | UUID | UNIQUE NOT NULL | 评论唯一标识 |
| article_id | BIGINT | REFERENCES blog_articles(id) | 文章ID |
| parent_id | BIGINT | REFERENCES blog_comments(id) | 父评论ID（支持回复） |
| visitor_name | VARCHAR(50) | | 访客昵称 |
| visitor_email | VARCHAR(255) | | 访客邮箱（可选） |
| visitor_website | VARCHAR(255) | | 访客网站（可选） |
| content | TEXT | NOT NULL | 评论内容 |
| html_content | TEXT | | HTML渲染内容 |
| ip_address | INET | | IP地址 |
| user_agent | TEXT | | 用户代理 |
| status | VARCHAR(20) | DEFAULT 'approved' | 评论状态（approved/pending/deleted） |
| is_deleted | BOOLEAN | DEFAULT false | 是否已删除 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

#### SEO数据表：blog_seo_data
| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGSERIAL | PRIMARY KEY | 自增主键 |
| article_id | BIGINT | REFERENCES blog_articles(id) | 文章ID |
| meta_title | VARCHAR(255) | | SEO标题 |
| meta_description | TEXT | | SEO描述 |
| meta_keywords | TEXT | | SEO关键词 |
| og_title | VARCHAR(255) | | Open Graph标题 |
| og_description | TEXT | | Open Graph描述 |
| og_image | VARCHAR(255) | | Open Graph图片 |
| twitter_title | VARCHAR(255) | | Twitter标题 |
| twitter_description | TEXT | | Twitter描述 |
| twitter_image | VARCHAR(255) | | Twitter图片 |
| canonical_url | VARCHAR(500) | | 规范URL |
| json_ld | JSONB | | JSON-LD结构化数据 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 更新时间 |

### 3. 索引设计
- `idx_blog_articles_author_id`：作者ID索引，用于用户文章查询
- `idx_blog_articles_slug`：URL别名索引，用于友好URL路由
- `idx_blog_articles_status`：状态索引，用于状态过滤
- `idx_blog_articles_created_at`：创建时间索引，用于时间排序
- `idx_blog_articles_publish_at`：发布时间索引，用于发布时间排序
- `idx_blog_articles_is_top`：置顶索引，用于置顶文章查询
- `idx_blog_articles_title`：标题索引，用于标题搜索
- `idx_blog_categories_parent_id`：父分类索引，用于分类树查询
- `idx_blog_article_tags_article_id`：文章ID索引，用于标签查询
- `idx_blog_comments_article_id`：文章ID索引，用于评论查询
- `idx_blog_comments_created_at`：创建时间索引，用于评论排序

### 4. 数据结构定义
```go
type BlogArticle struct {
    ID            int64                  `json:"id"`
    ArticleID     string                 `json:"articleId"`
    Title         string                 `json:"title"`
    Slug          string                 `json:"slug"`
    Summary       string                 `json:"summary"`
    Content       string                 `json:"content"`
    HTMLContent   string                 `json:"htmlContent"`
    AuthorID      int64                  `json:"authorId"`
    CategoryID    int64                  `json:"categoryId"`
    Status        string                 `json:"status"`
    IsDraft       bool                   `json:"isDraft"`
    IsTop         bool                   `json:"isTop"`
    IsPrivate     bool                   `json:"isPrivate"`
    ViewCount     int                    `json:"viewCount"`
    LikeCount     int                    `json:"likeCount"`
    CommentCount  int                    `json:"commentCount"`
    ShareCount    int                    `json:"shareCount"`
    FeaturedImage string                 `json:"featuredImage"`
    ReadTime      int                    `json:"readTime"`
    PublishAt     *time.Time             `json:"publishAt"`
    CreatedAt     time.Time             `json:"createdAt"`
    UpdatedAt     time.Time             `json:"updatedAt"`
    DeletedAt     *time.Time            `json:"deletedAt"`
}

type BlogCategory struct {
    ID            int64              `json:"id"`
    CategoryID    string             `json:"categoryId"`
    Name          string             `json:"name"`
    Slug          string             `json:"slug"`
    Description   string             `json:"description"`
    ParentID      *int64            `json:"parentId"`
    SortOrder     int               `json:"sortOrder"`
    ArticleCount  int               `json:"articleCount"`
    IsActive      bool              `json:"isActive"`
    CreatedAt     time.Time          `json:"createdAt"`
    UpdatedAt     time.Time          `json:"updatedAt"`
}

type BlogTag struct {
    ID            int64              `json:"id"`
    TagID         string             `json:"tagId"`
    Name          string             `json:"name"`
    Slug          string             `json:"slug"`
    Description   string             `json:"description"`
    Color         string             `json:"color"`
    ArticleCount  int               `json:"articleCount"`
    IsActive      bool              `json:"isActive"`
    CreatedAt     time.Time          `json:"createdAt"`
    UpdatedAt     time.Time          `json:"updatedAt"`
}

type BlogComment struct {
    ID            int64              `json:"id"`
    CommentID     string             `json:"commentId"`
    ArticleID     int64              `json:"articleId"`
    ParentID      *int64            `json:"parentId"`        // 支持回复功能
    VisitorName   string             `json:"visitorName"`    // 访客昵称
    VisitorEmail  string             `json:"visitorEmail"`   // 访客邮箱（可选）
    VisitorWebsite string            `json:"visitorWebsite"`  // 访客网站（可选）
    Content       string             `json:"content"`         // 评论内容
    HTMLContent   string             `json:"htmlContent"`    // HTML渲染内容
    IPAddress     string             `json:"ipAddress"`      // IP地址
    UserAgent     string             `json:"userAgent"`      // 用户代理
    Status        string             `json:"status"`         // 评论状态
    IsDeleted     bool               `json:"isDeleted"`      // 是否已删除
    CreatedAt     time.Time          `json:"createdAt"`      // 创建时间
}

type SEOData struct {
    ID            int64              `json:"id"`
    ArticleID     int64              `json:"articleId"`
    MetaTitle     string             `json:"metaTitle"`
    MetaDescription string             `json:"metaDescription"`
    MetaKeywords  string             `json:"metaKeywords"`
    OGTitle      string             `json:"ogTitle"`
    OGDescription string             `json:"ogDescription"`
    OGImage      string             `json:"ogImage"`
    TwitterTitle  string             `json:"twitterTitle"`
    TwitterDesc   string             `json:"twitterDescription"`
    TwitterImage  string             `json:"twitterImage"`
    CanonicalURL  string             `json:"canonicalUrl"`
    JSONLD        interface{}        `json:"jsonLd"`
    CreatedAt     time.Time          `json:"createdAt"`
    UpdatedAt     time.Time          `json:"updatedAt"`
}
```

### 5. 配置选项结构
```typescript
interface BlogEditorConfig {
  maxContentLength: number;      // 最大内容长度
  maxImageCount: number;         // 最大图片数量
  maxFileSize: number;          // 最大文件大小
  allowedImageTypes: string[];   // 允许的图片类型
  allowedVideoTypes: string[];   // 允许的视频类型
  enableRealTimePreview: boolean;   // 启用实时预览
  enableAutoSave: boolean;        // 启用自动保存
  autoSaveInterval: number;       // 自动保存间隔（秒）
  enableTableOfContents: boolean; // 启用目录生成
  enableCodeHighlight: boolean;   // 启用代码高亮
  enableEmojis: boolean;          // 启用表情符号
  enableMathJax: boolean;         // 启用数学公式渲染
  enableMermaid: boolean;         // 启用流程图渲染
  enableImageUpload: boolean;     // 启用图片上传
  enableLinkPreview: boolean;    // 启用链接预览
}
```

### 6. 文章状态枚举定义
```go
type ArticleStatus string

const (
    StatusDraft    ArticleStatus = "draft"     // 草稿
    StatusPublish  ArticleStatus = "published"  // 已发布
    StatusPrivate ArticleStatus = "private"  // 私密
    StatusArchive  ArticleStatus = "archive"  // 归档
)
```

### 7. 评论状态枚举定义（简化版）
```go
type CommentStatus string

const (
    CommentApproved CommentStatus = "approved"  // 已通过（正常显示）
    CommentPending   CommentStatus = "pending"   // 待审核（仅博主可见）
    CommentDeleted  CommentStatus = "deleted"   // 已删除（不显示）
)
```

### 8. 用户角色枚举定义（个人博客简化版）
```go
type UserRole string

const (
    RoleAdmin  UserRole = "admin"   // 博主（拥有所有权限）
    RoleVisitor UserRole = "visitor" // 访客（只能阅读和评论）
)
```

## 技术实现特色

### 1. Markdown增强功能
- **代码块高亮**：支持多种编程语言的语法高亮
- **数学公式渲染**：集成MathJax或KaTeX
- **流程图支持**：集成Mermaid或PlantUML
- **表情符号**：支持GitHub风格的表情符号
- **表格编辑**：可视化表格编辑界面
- **任务列表**：支持GitHub风格的任务列表
- **脚注引用**：支持学术论文风格脚注

### 2. 性能优化策略
- **内容缓存**：HTML渲染结果缓存，减少重复解析
- **搜索索引**：倒排索引优化，提高搜索性能
- **分页加载**：大列表分页，减少初始加载时间
- **图片懒加载**：文章内图片懒加载，提升页面性能
- **CDN支持**：静态资源CDN加速，提升访问速度

### 3. 安全性保障（个人博客简化版）
- **内容过滤**：敏感词过滤和XSS防护
- **权限控制**：博主管理权限，访客阅读和评论权限
- **输入验证**：评论内容格式验证，防止恶意输入
- **SQL注入防护**：参数化查询，防止SQL注入攻击
- **评论审核**：博主可删除违规评论和设置评论状态

### 4. SEO优化功能
- **语义化HTML**：使用HTML5语义化标签
- **结构化数据**：JSON-LD微数据和Schema.org
- **移动端优化**：响应式设计，移动端友好
- **页面速度优化**：Core Web Vitals指标优化
- **搜索引擎友好**：robots.txt、sitemap.xml自动生成

### 5. 扩展性设计
- **插件系统**：支持第三方插件扩展
- **主题系统**：可切换的博客主题
- **API接口**：RESTful API设计，支持第三方集成
- **Webhook支持**：文章发布/更新事件通知
- **导入导出**：支持多种格式的数据导入导出

## 实际实现状态

### ✅ 已完成功能
- **基础架构搭建**：GoFrame后端 + Next.js前端 + PostgreSQL数据库
- **数据库结构**：完整的博客表结构（文章、分类、标签、评论等）
- **文章管理**：
  - 文章列表查询和分页
  - 文章详情页面（支持Markdown渲染）
  - 文章编辑页面（支持实时预览）
  - 文章创建和更新功能
- **Markdown处理**：
  - react-markdown + remark-gfm + rehype-highlight
  - 支持标题、列表、表格、代码块、引用等
  - 代码语法高亮（深色主题）
  - 实时预览切换
- **用户界面**：
  - 现代化编辑界面设计
  - 响应式布局
  - 字数统计和阅读时间计算
  - Arco Design组件集成
- **API接口**：
  - JWT认证保护
  - RESTful接口设计
  - 完整的CRUD操作

### 🚧 待实现功能
- **草稿系统**：自动保存和草稿管理
- **版本控制**：文章历史版本和回滚功能
- **评论系统**：匿名评论和管理功能
- **SEO优化**：元数据管理和结构化数据
- **搜索功能**：全文搜索和筛选
- **分类标签**：完整的分类和标签管理
- **文件上传**：图片和附件上传功能
- **定时发布**：文章定时发布功能

### 📝 技术实现备注
- **前端渲染**：使用react-markdown而非marked.js，提供更好的React集成
- **代码高亮**：rehype-highlight替代highlight.js，提供更现代的高亮方案
- **编辑器**：使用原生textarea配合预览模式，而非复杂的CodeMirror集成
- **状态管理**：React Hooks本地状态管理，未引入复杂的状态管理库
- **数据流**：简化版数据流，去除了版本控制等复杂逻辑

## 数据库设计模式

### 1. 内容管理分层模式

**文章内容双重存储**：
- `content` (TEXT) - Markdown原始内容，用于编辑和版本控制
- `html_content` (TEXT) - HTML渲染内容，用于前端展示，提升渲染性能

**内容状态多维度控制**：
```sql
-- 文章状态控制
status: 'draft' | 'published' | 'private' | 'archive'  -- 发布状态
is_draft: boolean                                           -- 草稿标识
is_private: boolean                                        -- 私密标识
is_top: boolean                                            -- 置顶标识
deleted_at: timestamptz                                   -- 软删除时间
```

### 2. 分类标签多对多模式

**层级分类设计**：
- `parent_id` 自引用实现多级分类树结构
- `sort_order` 字段支持同级分类排序
- `article_count` 冗余计数，提升查询性能

**标签扁平化管理**：
- 独立标签表，支持颜色标识和描述
- `blog_article_tags` 关联表实现文章与标签多对多关系
- 标签使用频率统计（`article_count`）

### 3. 版本控制快照模式

**完整版本快照**：
```sql
-- 每次编辑保存完整内容快照
CREATE TABLE blog_article_versions (
    version_id UUID UNIQUE,           -- 版本唯一标识
    article_id BIGINT,               -- 关联文章
    version INTEGER,                 -- 递增版本号
    change_type VARCHAR(20),         -- create/update/delete
    diff_data JSONB,                 -- 差异数据（JSON格式）
    operator_id BIGINT,              -- 操作者ID（预留）
    title VARCHAR(255),              -- 版本标题
    content TEXT,                    -- 完整内容快照
    html_content TEXT                -- 渲染内容快照
);
```

**变更追踪机制**：
- `change_type` 记录操作类型
- `diff_data` 存储结构化差异数据
- `operator_id` 预留多用户协作接口

### 4. SEO数据独立存储模式

**元数据专业化管理**：
```sql
-- SEO数据独立表设计，支持多平台优化
CREATE TABLE blog_seo_data (
    meta_title VARCHAR(255),          -- 页面标题
    meta_description TEXT,            -- 页面描述
    meta_keywords TEXT,              -- 关键词
    og_title VARCHAR(255),           -- Open Graph标题
    og_description TEXT,             -- Open Graph描述
    og_image VARCHAR(255),           -- Open Graph图片
    twitter_title VARCHAR(255),      -- Twitter Card标题
    twitter_description TEXT,        -- Twitter Card描述
    json_ld JSONB                    -- JSON-LD结构化数据
);
```

**多平台元数据支持**：
- 标准SEO元数据（title, description, keywords）
- Open Graph协议（Facebook、LinkedIn社交分享）
- Twitter Card（Twitter社交分享）
- JSON-LD结构化数据（搜索引擎理解）

### 5. 评论系统简化模式

**匿名评论设计**：
```sql
-- 简化评论系统，支持匿名用户
CREATE TABLE blog_comments (
    visitor_name VARCHAR(50),        -- 访客昵称（必需）
    visitor_email VARCHAR(255),      -- 访客邮箱（可选）
    visitor_website VARCHAR(255),    -- 访客网站（可选）
    ip_address INET,                 -- IP地址记录
    user_agent TEXT,                 -- 用户代理记录
    status VARCHAR(20),              -- approved/pending/deleted
    parent_id BIGINT,                -- 支持回复功能
    is_deleted BOOLEAN DEFAULT false -- 软删除
);
```

**审核管理简化**：
- 仅支持博主删除违规评论
- 无复杂审批流程
- IP和User-Agent记录用于安全分析

### 6. 搜索索引优化模式

**PostgreSQL全文搜索**：
```sql
-- 创建全文搜索索引
CREATE INDEX idx_blog_articles_title
ON blog_articles USING gin(to_tsvector('simple', title));
CREATE INDEX idx_blog_articles_content
ON blog_articles USING gin(to_tsvector('simple', content));
```

**中文搜索配置**：
```sql
-- 创建中文全文搜索配置
CREATE TEXT SEARCH CONFIGURATION chinese (COPY = simple);
```

**搜索性能优化**：
- GIN索引提升全文搜索性能
- 独立搜索配置支持中文分词扩展
- 标题和内容分离索引，优化搜索权重

### 7. 统计信息冗余模式

**实时统计字段**：
```sql
-- 文章统计信息（冗余存储）
view_count INTEGER DEFAULT 0,      -- 浏览次数
like_count INTEGER DEFAULT 0,      -- 点赞数
comment_count INTEGER DEFAULT 0,   -- 评论数
share_count INTEGER DEFAULT 0,     -- 分享数
read_time INTEGER DEFAULT 0        -- 预估阅读时间
```

**分类标签统计**：
```sql
-- 分类和标签统计（冗余存储）
article_count INTEGER DEFAULT 0    -- 文章数量统计
```

**性能优化策略**：
- 冗余计数避免实时统计查询
- 定期批量更新统计数据
- 缓存热门文章统计信息

### 8. 预留扩展模式

**多用户系统预留**：
- `author_id BIGINT` 预留作者关联
- `operator_id BIGINT` 预留操作者追踪
- 统一用户ID字段设计

**协作编辑预留**：
- 版本控制表支持多操作者
- 变更类型和摘要记录
- 冲突解决机制预留

**权限系统预留**：
- 文章可见性控制（`is_private`）
- 评论状态管理（`status`）
- 软删除机制（`deleted_at`, `is_deleted`）

**功能扩展预留**：
- `extra JSONB` 字段在weibo模块中，blog模块可类似添加
- 文章系列、专题分类等扩展接口
- API版本控制预留

这个博客模块设计将为JieCool项目提供一个专注个人博客需求的轻量级博客系统，核心功能完整但不过度复杂，特别适合个人博主使用。系统支持Markdown文章创作、匿名评论互动、SEO优化等个人博客核心功能，同时保持架构的简洁性和可维护性。

当前实现验证了基础架构的可行性，为后续功能扩展奠定了坚实基础。