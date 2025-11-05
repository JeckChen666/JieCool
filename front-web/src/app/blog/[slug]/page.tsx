'use client'

import { useState, useEffect } from 'react'
import { Card, Typography, Tag, Avatar, Button, Space, Divider, Spin } from '@arco-design/web-react'
import { Message } from '@arco-design/web-react'
import { IconClockCircle, IconEye, IconHeart, IconMessage, IconShareAlt, IconEdit } from '@arco-design/web-react/icon'
import { useRouter } from 'next/navigation'
import { blogApi } from '@/lib/blog-api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

const { Title, Paragraph } = Typography

interface BlogArticle {
  id: number
  title: string
  slug: string
  summary: string
  content: string
  htmlContent: string
  categoryId: number
  categoryName: string
  status: number
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
  tags: Array<{
    id: number
    name: string
    slug: string
  }>
  seo: {
    metaTitle: string
    metaDescription: string
    metaKeywords: string
    ogTitle: string
    ogDescription: string
    ogImage: string
    twitterTitle: string
    twitterDesc: string
    twitterImage: string
    canonicalURL: string
  }
}

export default function BlogDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticle()
  }, [params.slug])

  const fetchArticle = async () => {
    try {
      setLoading(true)
      // 通过slug查找文章，需要先调用列表接口找到对应ID
      const listResponse = await blogApi.getArticles({ page: 1, size: 100 })

      if (listResponse?.list && listResponse.list.length > 0) {
        const foundArticle = listResponse.list.find((item: any) => item.slug === params.slug)

        if (foundArticle) {
          const detailResponse = await blogApi.getArticleDetail(foundArticle.id)
          setArticle(detailResponse as any)
        } else {
          Message.error('文章不存在')
          router.push('/blog')
        }
      } else {
        Message.error('文章不存在')
        router.push('/blog')
      }
    } catch (error) {
      console.error('Failed to fetch article:', error)
      Message.error('获取文章详情失败')
      router.push('/blog')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleEdit = () => {
    router.push(`/blog/edit/${article?.id}`)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.summary,
          url: window.location.href,
        })
      } catch (error) {
        console.log('分享失败:', error)
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
      Message.success('链接已复制到剪贴板')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!article) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>文章不存在</div>
        <Button type="primary" onClick={() => router.push('/blog')}>
          返回博客列表
        </Button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 主要内容 */}
        <div style={{ flex: 1 }}>
          <Card>
            {/* 文章头部 */}
            <div style={{ marginBottom: '24px' }}>
              {article.isTop && (
                <Tag color="red" style={{ marginBottom: '12px' }}>
                  置顶
                </Tag>
              )}
              {article.isDraft && (
                <Tag color="orange" style={{ marginBottom: '12px' }}>
                  草稿
                </Tag>
              )}
              {article.isPrivate && (
                <Tag color="gray" style={{ marginBottom: '12px' }}>
                  私密
                </Tag>
              )}

              <Title heading={1} style={{ marginBottom: '16px' }}>
                {article.title}
              </Title>

              <Paragraph style={{ fontSize: '16px', color: '#666', marginBottom: '20px' }}>
                {article.summary}
              </Paragraph>

              {/* 文章元信息 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                color: '#666',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                <Space>
                  <Avatar size="small" style={{ backgroundColor: '#3370ff' }}>
                    J
                  </Avatar>
                  <span>JieCool</span>
                </Space>

                <Space>
                  <IconClockCircle />
                  <span>{article.publishAt ? formatDate(article.publishAt) : formatDate(article.createdAt)}</span>
                </Space>

                {article.readTime > 0 && (
                  <span>阅读时间: {article.readTime}分钟</span>
                )}
              </div>

              {/* 标签 */}
              {article.tags && article.tags.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <Space wrap>
                    {article.tags.map(tag => (
                      <Tag
                        key={tag.id}
                        color="blue"
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/blog?tag=${tag.slug}`)}
                      >
                        {tag.name}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              <Divider />
            </div>

            {/* 文章内容 */}
            <div style={{
              fontSize: '16px',
              lineHeight: '1.8',
              color: '#333'
            }}>
              {article.htmlContent ? (
                <div
                  dangerouslySetInnerHTML={{ __html: article.htmlContent }}
                  style={{
                    '& h1, & h2, & h3, & h4, & h5, & h6': {
                      marginTop: '24px',
                      marginBottom: '16px'
                    },
                    '& p': {
                      marginBottom: '16px'
                    },
                    '& blockquote': {
                      borderLeft: '4px solid #3370ff',
                      paddingLeft: '16px',
                      margin: '16px 0',
                      color: '#666'
                    },
                    '& pre': {
                      backgroundColor: '#f5f5f5',
                      padding: '16px',
                      borderRadius: '8px',
                      overflow: 'auto',
                      marginBottom: '16px'
                    },
                    '& img': {
                      maxWidth: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      margin: '16px 0'
                    }
                  }}
                />
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({children}) => <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '24px 0 16px' }}>{children}</h1>,
                    h2: ({children}) => <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0 14px' }}>{children}</h2>,
                    h3: ({children}) => <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '18px 0 12px' }}>{children}</h3>,
                    p: ({children}) => <p style={{ marginBottom: '16px', lineHeight: '1.8' }}>{children}</p>,
                    blockquote: ({children}) => (
                      <blockquote style={{
                        borderLeft: '4px solid #3370ff',
                        paddingLeft: '16px',
                        margin: '16px 0',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        {children}
                      </blockquote>
                    ),
                    code: ({inline, children}) => (
                      inline ?
                        <code style={{
                          backgroundColor: '#f5f5f5',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}>{children}</code> :
                        <pre style={{
                          backgroundColor: '#f5f5f5',
                          padding: '16px',
                          borderRadius: '8px',
                          overflow: 'auto',
                          fontSize: '14px',
                          lineHeight: '1.5'
                        }}>{children}</pre>
                    ),
                    img: ({src, alt}) => (
                      <img
                        src={src}
                        alt={alt}
                        style={{
                          maxWidth: '100%',
                          height: 'auto',
                          borderRadius: '8px',
                          margin: '16px 0'
                        }}
                      />
                    ),
                    ul: ({children}) => <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ul>,
                    ol: ({children}) => <ol style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ol>,
                    li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>
                  }}
                >
                  {article.content}
                </ReactMarkdown>
              )}
            </div>

            {/* 文章底部操作 */}
            <Divider />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <Space>
                <Space>
                  <IconEye />
                  <span>{article.viewCount}</span>
                </Space>
                <Space>
                  <IconHeart />
                  <span>{article.likeCount}</span>
                </Space>
                <Space>
                  <IconMessage />
                  <span>{article.commentCount}</span>
                </Space>
                <Space>
                  <IconShareAlt />
                  <span>{article.shareCount}</span>
                </Space>
              </Space>

              <Space>
                <Button
                  type="outline"
                  icon={<IconShareAlt />}
                  onClick={handleShare}
                >
                  分享
                </Button>
                <Button
                  type="outline"
                  icon={<IconEdit />}
                  onClick={handleEdit}
                >
                  编辑
                </Button>
              </Space>
            </div>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div style={{ width: '300px' }}>
          <Card title="关于作者" style={{ marginBottom: '20px' }}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Avatar size={64} style={{ backgroundColor: '#3370ff' }}>
                J
              </Avatar>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>JieCool</div>
                <div style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                  热爱编程，喜欢分享技术心得和生活感悟
                </div>
              </div>
            </Space>
          </Card>

          {article.tags && article.tags.length > 0 && (
            <Card title="文章标签" style={{ marginBottom: '20px' }}>
              <Space wrap>
                {article.tags.map(tag => (
                  <Tag
                    key={tag.id}
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/blog?tag=${tag.slug}`)}
                  >
                    {tag.name}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          <Card title="相关文章">
            <div style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
              相关文章功能开发中...
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}