'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Tag, Pagination, Spin, Empty, Typography, Space } from '@arco-design/web-react'
import { IconSearch, IconEdit, IconEye, IconMessage, IconClock } from '@arco-design/web-react/icon'
import { blogApi } from '@/lib/blog-api'
import type { BlogArticle, ArticleListParams } from '@/types/blog'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

export default function BlogPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await blogApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('获取分类失败:', error)
      setCategories([])
    }
  }

  // 获取文章列表
  const fetchArticles = async (params: Partial<ArticleListParams> = {}) => {
    setLoading(true)
    try {
      const response = await blogApi.getArticles({
        page: currentPage,
        size: pageSize,
        search: searchKeyword,
        categoryId: selectedCategory || undefined,
        status: 'published',
        ...params
      })

      setArticles(response?.list || [])
      setTotal(response?.total || 0)
    } catch (error) {
      console.error('获取文章列表失败:', error)
      setArticles([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1)
  }

  // 分类筛选处理
  const handleCategoryFilter = (categoryId: number | null) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 计算阅读时间显示
  const formatReadTime = (readTime: number) => {
    if (readTime < 1) return '1分钟阅读'
    if (readTime < 60) return `${readTime}分钟阅读`
    const hours = Math.floor(readTime / 60)
    const minutes = readTime % 60
    return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}阅读`
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchArticles()
  }, [currentPage, searchKeyword, selectedCategory])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Title heading={1} className="text-center mb-4">
          博客文章
        </Title>
        <Text className="text-center text-gray-600">
          分享技术见解，记录学习历程
        </Text>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="搜索文章..."
              prefix={<IconSearch />}
              value={searchKeyword}
              onChange={(value) => handleSearch(value)}
              allowClear
            />
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 flex-wrap">
            <Tag
              color={selectedCategory === null ? 'blue' : 'gray'}
              className="cursor-pointer"
              onClick={() => handleCategoryFilter(null)}
            >
              全部
            </Tag>
            {categories.map((category) => (
              <Tag
                key={category.id}
                color={selectedCategory === category.id ? 'blue' : 'gray'}
                className="cursor-pointer"
                onClick={() => handleCategoryFilter(category.id)}
              >
                {category.name} ({category.articleCount})
              </Tag>
            ))}
          </div>

          {/* 写文章按钮 */}
          <Link href="/blog/create">
            <Button type="primary" icon={<IconEdit />}>
              写文章
            </Button>
          </Link>
        </div>
      </div>

      {/* 文章列表 */}
      <div className="grid gap-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : articles.length === 0 ? (
          <Empty
            className="py-12"
            description="暂无文章"
          />
        ) : (
          <>
            {articles.map((article) => (
              <Card
                key={article.id}
                className="hover:shadow-md transition-shadow"
                size="small"
              >
                <div className="p-6">
                  {/* 文章标题 */}
                  <div className="mb-3">
                    <Link href={`/blog/${article.slug}`}>
                      <Title
                        heading={3}
                        className="text-xl font-medium mb-2 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        {article.title}
                        {article.isTop && (
                          <Tag color="red" size="small" className="ml-2">
                            置顶
                          </Tag>
                        )}
                      </Title>
                    </Link>

                    {/* 文章摘要 */}
                    {article.summary && (
                      <Text className="text-gray-600 mb-4 line-clamp-2">
                        {article.summary}
                      </Text>
                    )}

                    {/* 文章元信息 */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <IconClock />
                        {formatDate(article.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconEye />
                        {article.viewCount} 阅读
                      </span>
                      <span className="flex items-center gap-1">
                        <IconMessage />
                        {article.commentCount} 评论
                      </span>
                      <span>
                        {formatReadTime(article.readTime)}
                      </span>
                      {article.categoryName && (
                        <Tag color="green" size="small">
                          {article.categoryName}
                        </Tag>
                      )}
                    </div>

                    {/* 标签 */}
                    {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {article.tags.map((tag) => (
                          <Tag
                            key={tag.id}
                            size="small"
                            style={{ backgroundColor: tag.color || '#1890ff' }}
                          >
                            {tag.name}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-2 border-t pt-4">
                    <Link href={`/blog/${article.slug}`}>
                      <Button type="text" size="small">
                        阅读全文
                      </Button>
                    </Link>
                    <Link href={`/blog/${article.slug}/edit`}>
                      <Button type="outline" size="small">
                        编辑
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}

            {/* 分页 */}
            {total > pageSize && (
              <div className="flex justify-center mt-8">
                <Pagination
                  total={total}
                  current={currentPage}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger
                  showTotal
                  showJumper
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}