// 博客相关类型定义

// 文章状态枚举
export type ArticleStatus = 'draft' | 'published' | 'private' | 'archive'

// 评论状态枚举
export type CommentStatus = 'approved' | 'pending' | 'deleted'

// 博客文章
export interface BlogArticle {
    id: number
    title: string
    slug: string
    summary: string
    content: string
    htmlContent: string
    categoryId: number
    categoryName: string
    status: ArticleStatus
    isDraft: boolean
    isTop: boolean
    isPrivate: boolean
    viewCount: number
    likeCount: number
    commentCount: number
    shareCount: number
    featuredImage: string
    readTime: number
    publishAt: string | null
    createdAt: string
    updatedAt: string
    tags: BlogTag[] | null
    category?: BlogCategory
    seo?: SEOData
}

// 博客分类
export interface BlogCategory {
    id: number
    categoryId: string
    name: string
    slug: string
    description: string
    parentId: number | null
    sortOrder: number
    articleCount: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// 博客标签
export interface BlogTag {
    id: number
    name: string
    slug: string
    description?: string
    color?: string
}

// 博客评论
export interface BlogComment {
    id: number
    commentId: string
    articleId: number
    parentId: number | null
    visitorName: string
    visitorEmail: string
    visitorWebsite: string
    content: string
    htmlContent: string
    ipAddress: string
    userAgent: string
    status: CommentStatus
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    replies?: BlogComment[] // 回复评论
}

// SEO数据
export interface SEOData {
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    ogTitle: string
    ogDescription: string
    ogImage: string
    twitterTitle: string
    twitterDesc: string
    twitterImage: string
    canonicalUrl: string
}

// 请求类型

// 创建文章请求
export interface CreateArticleRequest {
    title: string
    slug: string
    summary?: string
    content: string
    categoryId: number
    tags: string[]
    status: ArticleStatus
    isDraft?: boolean
    isTop?: boolean
    isPrivate?: boolean
    featuredImage?: string
    publishAt?: string
    seo?: Partial<SEOData>
}

// 更新文章请求
export interface UpdateArticleRequest extends CreateArticleRequest {
    id: number
}

// 文章列表查询参数
export interface ArticleListParams {
    page?: number
    size?: number
    categoryId?: number
    tag?: string
    status?: ArticleStatus
    search?: string
}

// 创建评论请求
export interface CreateCommentRequest {
    articleId: number
    parentId?: number
    visitorName: string
    visitorEmail?: string
    visitorWebsite?: string
    content: string
}

// 评论列表查询参数
export interface CommentListParams {
    page?: number
    size?: number
    status?: CommentStatus
}

// 创建分类请求
export interface CreateCategoryRequest {
    name: string
    slug: string
    description?: string
    parentId?: number
    sortOrder?: number
}

// 文章列表响应
export interface ArticleListResponse {
    page: number
    size: number
    total: number
    list: BlogArticle[]
}

// 评论列表响应
export interface CommentListResponse {
    page: number
    size: number
    total: number
    list: BlogComment[]
}

// 分类列表响应
export interface CategoryListResponse {
    list: BlogCategory[]
}