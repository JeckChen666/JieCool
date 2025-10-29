import { alova } from './alova'
import type {
  BlogArticle,
  BlogCategory,
  BlogTag,
  BlogComment,
  CreateArticleRequest,
  UpdateArticleRequest,
  CreateCommentRequest,
  ArticleListParams,
  CommentListParams
} from '@/types/blog'

// 博客API客户端
export const blogApi = {
  // 文章管理
  // 创建文章
  createArticle: (data: CreateArticleRequest) =>
    alova.Post<BlogArticle>('/blog/articles', data),

  // 更新文章
  updateArticle: (id: number, data: UpdateArticleRequest) =>
    alova.Put<BlogArticle>(`/blog/articles?id=${id}`, data),

  // 获取文章列表
  getArticles: (params: ArticleListParams) =>
    alova.Get<{
      page: number
      size: number
      total: number
      list: BlogArticle[]
    }>('/blog/articles', { params }),

  // 获取文章详情
  getArticleDetail: (id: number, incrementView = true) =>
    alova.Get<BlogArticle>(`/blog/articles/detail?id=${id}&incrementView=${incrementView}`),

  // 删除文章
  deleteArticle: (id: number) =>
    alova.Delete<{ deleted: boolean }>(`/blog/articles?id=${id}`),

  // 分类管理
  // 创建分类
  createCategory: (data: { name: string; slug: string; description?: string; parentId?: number; sortOrder?: number }) =>
    alova.Post<BlogCategory>('/blog/categories', data),

  // 获取分类列表
  getCategories: () =>
    alova.Get<{list: BlogCategory[]}>('/blog/categories'),

  // 评论管理
  // 创建评论
  createComment: (data: CreateCommentRequest) =>
    alova.Post<BlogComment>('/blog/comments', data),

  // 获取评论列表
  getComments: (articleId: number, params: CommentListParams) =>
    alova.Get<{
      page: number
      size: number
      total: number
      list: BlogComment[]
    }>(`/blog/comments?articleId=${articleId}`, { params }),

  // 删除评论
  deleteComment: (id: number) =>
    alova.Delete<{ deleted: boolean }>(`/blog/comments?id=${id}`)
}