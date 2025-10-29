'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Tag, Pagination, Spin, Empty, Typography, Space } from '@arco-design/web-react'
import { IconSearch, IconEdit, IconEye, IconMessage, IconClockCircle } from '@arco-design/web-react/icon'
import { blogApi } from '@/lib/blog-api'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

interface BlogArticle {
  id: number
  title: string
  slug: string
  summary: string
  categoryId: number
  categoryName: string
  status: string
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
  tags: any[] | null
}

export default function BlogPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<BlogArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchArticles = async (params: any = {}) => {
    setLoading(true)
    try {
      const response = await blogApi.getArticles({
        page: currentPage,
        size: pageSize,
        search: searchKeyword,
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

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatReadTime = (readTime: number) => {
    if (readTime < 1) return '1分钟阅读'
    if (readTime < 60) return `${readTime}分钟阅读`
    const hours = Math.floor(readTime / 60)
    const minutes = readTime % 60
    return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}阅读`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  useEffect(() => {
    fetchArticles()
  }, [currentPage, searchKeyword])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title heading={1} style={{ marginBottom: '16px' }}>
          博客文章
        </Title>
        <Text style={{ color: '#666' }}>
          分享技术见解，记录学习历程
        </Text>
      </div>

      <div style={{ marginBottom: '24px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Input
              placeholder="搜索文章..."
              prefix={<IconSearch />}
              value={searchKeyword}
              onChange={(value) => handleSearch(value)}
              allowClear
            />
          </div>

          <Link href="/blog/create">
            <Button type="primary" icon={<IconEdit />}>
              写文章
            </Button>
          </Link>
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spin size="large" />
          </div>
        ) : articles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Empty description="暂无文章" />
          </div>
        ) : (
          <>
            {articles.map((article) => (
              <Card
                key={article.id}
                style={{ marginBottom: '16px' }}
                size="small"
              >
                <div style={{ padding: '24px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <Link href={`/blog/${article.slug}`}>
                      <Title
                        heading={3}
                        style={{
                          fontSize: '20px',
                          fontWeight: '500',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        {article.title}
                        {article.isTop && (
                          <Tag color="red" size="small" style={{ marginLeft: '8px' }}>
                            置顶
                          </Tag>
                        )}
                      </Title>
                    </Link>

                    {article.summary && (
                      <Text style={{ color: '#666', marginBottom: '16px', display: 'block' }}>
                        {article.summary}
                      </Text>
                    )}

                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '16px'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconClockCircle />
                        {formatDate(article.createdAt)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconEye />
                        {article.viewCount} 阅读
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <IconMessage />
                        {article.commentCount} 评论
                      </span>
                      <span>
                        {formatReadTime(article.readTime)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '8px',
                      borderTop: '1px solid #f0f0f0',
                      paddingTop: '16px'
                    }}>
                      <Link href={`/blog/${article.slug}`}>
                        <Button type="text" size="small">
                          阅读全文
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {total > pageSize && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
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