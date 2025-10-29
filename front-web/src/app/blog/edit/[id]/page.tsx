'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Button, Message, Typography, Spin, Space, Divider } from '@arco-design/web-react'
import { IconSave, IconEdit, IconEye, IconArrowLeft } from '@arco-design/web-react/icon'
import { blogApi } from '@/lib/blog-api'
import type { UpdateArticleRequest, BlogCategory, BlogArticle } from '@/types/blog'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

const { Title, Text } = Typography

export default function EditBlogPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [article, setArticle] = useState<BlogArticle | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: ''
  })

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await blogApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  // 获取文章详情
  const fetchArticle = async () => {
    try {
      setFetchLoading(true)
      const response = await blogApi.getArticleDetail(Number(params.id))
      setArticle(response)

      // 填充表单数据
      const data = {
        title: response.title,
        slug: response.slug,
        summary: response.summary || '',
        content: response.content
      }
      setFormData(data)
      form.setFieldsValue(data)
    } catch (error) {
      console.error('获取文章详情失败:', error)
      Message.error('获取文章详情失败')
      router.push('/blog')
    } finally {
      setFetchLoading(false)
    }
  }

  // 表单数据变化处理
  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // 自动生成slug
    if (field === 'title' && !formData.slug) {
      const slug = value.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
      form.setFieldValue('slug', slug)
      setFormData({ ...newFormData, slug })
    }
  }

  // 更新文章
  const handleUpdate = async (isDraft = false) => {
    try {
      const values = await form.validate()
      setLoading(true)

      const articleData: UpdateArticleRequest = {
        id: Number(params.id),
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/\s+/g, '-'),
        summary: values.summary,
        content: values.content,
        categoryId: values.categoryId || 1,
        tags: [],
        status: isDraft ? 'draft' : 'published',
        isDraft,
        isTop: article?.isTop || false,
        isPrivate: article?.isPrivate || false
      }

      await blogApi.updateArticle(Number(params.id), articleData)
      Message.success(isDraft ? '草稿保存成功' : '文章更新成功')

      if (!isDraft) {
        router.push(`/blog/${article?.slug}`)
      }
    } catch (error) {
      console.error('更新失败:', error)
      Message.error(isDraft ? '保存草稿失败' : '更新文章失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
    if (params.id) {
      fetchArticle()
    }
  }, [params.id])

  if (fetchLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '48px',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>正在加载文章...</div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card style={{ maxWidth: '400px', textAlign: 'center' }}>
          <Title heading={3} style={{ color: '#333' }}>文章不存在</Title>
          <Text style={{ color: '#666', marginBottom: '16px', display: 'block' }}>
            您要编辑的文章可能已被删除或不存在
          </Text>
          <Link href="/blog">
            <Button type="primary" size="large">
              返回博客列表
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 0',
        marginBottom: '32px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link href={`/blog/${article.slug}`}>
                <Button
                  type="text"
                  icon={<IconArrowLeft />}
                  style={{ color: '#666' }}
                >
                  返回文章
                </Button>
              </Link>
              <div>
                <Title heading={3} style={{ margin: 0, color: '#333' }}>
                  编辑文章
                </Title>
                <Text style={{ color: '#666', fontSize: '14px' }}>
                  最后修改: {new Date(article.updatedAt).toLocaleDateString('zh-CN')}
                </Text>
              </div>
            </div>

            <Space>
              <Button
                type="outline"
                icon={<IconEye />}
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? '编辑' : '预览'}
              </Button>
              <Button
                loading={loading}
                onClick={() => handleUpdate(true)}
                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => handleUpdate(false)}
                icon={<IconSave />}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                发布更新
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {/* 主要编辑区域 */}
          <div style={{ flex: 1 }}>
            <Card
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <Form form={form} layout="vertical" size="large">
                <Form.Item
                  label={
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                      文章标题
                    </span>
                  }
                  field="title"
                  rules={[{ required: true, message: '请输入文章标题' }]}
                >
                  <Input
                    placeholder="输入一个吸引人的标题..."
                    style={{
                      fontSize: '18px',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}
                    onChange={(value) => handleFormChange('title', value)}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                      URL 标识符
                    </span>
                  }
                  field="slug"
                >
                  <Input
                    placeholder="url-friendly-identifier"
                    prefix={
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        /blog/
                      </span>
                    }
                    style={{
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}
                    onChange={(value) => handleFormChange('slug', value)}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                      文章摘要
                    </span>
                  }
                  field="summary"
                >
                  <Input.TextArea
                    placeholder="简要描述文章内容，让读者快速了解文章主题..."
                    rows={3}
                    style={{
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb'
                    }}
                    onChange={(value) => handleFormChange('summary', value)}
                  />
                </Form.Item>
              </Form>
            </Card>

            <Card
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              bodyStyle={{ padding: '32px' }}
            >
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                  文章内容
                </Text>
                <Text style={{ color: '#666', fontSize: '14px', marginLeft: '8px' }}>
                  支持 Markdown 语法
                </Text>
              </div>

              {previewMode ? (
                <div style={{
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '24px',
                  minHeight: '400px',
                  fontSize: '16px',
                  lineHeight: '1.8',
                  color: '#333',
                  overflow: 'auto'
                }}>
                  {formData.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        h1: ({children}) => <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '24px 0 16px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>{children}</h1>,
                        h2: ({children}) => <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0 14px', color: '#374151' }}>{children}</h2>,
                        h3: ({children}) => <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '18px 0 12px', color: '#4b5563' }}>{children}</h3>,
                        h4: ({children}) => <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: '16px 0 10px', color: '#6b7280' }}>{children}</h4>,
                        h5: ({children}) => <h5 style={{ fontSize: '16px', fontWeight: 'bold', margin: '14px 0 8px', color: '#9ca3af' }}>{children}</h5>,
                        h6: ({children}) => <h6 style={{ fontSize: '14px', fontWeight: 'bold', margin: '12px 0 6px', color: '#9ca3af' }}>{children}</h6>,
                        p: ({children}) => <p style={{ marginBottom: '16px', lineHeight: '1.8' }}>{children}</p>,
                        ul: ({children}) => <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ul>,
                        ol: ({children}) => <ol style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ol>,
                        li: ({children}) => <li style={{ marginBottom: '4px', lineHeight: '1.6' }}>{children}</li>,
                        blockquote: ({children}) => (
                          <blockquote style={{
                            borderLeft: '4px solid #3b82f6',
                            paddingLeft: '16px',
                            margin: '16px 0',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '12px 16px',
                            borderRadius: '0 8px 8px 0',
                            fontStyle: 'italic'
                          }}>
                            {children}
                          </blockquote>
                        ),
                        code: ({inline, children}) => (
                          inline ? (
                            <code style={{
                              backgroundColor: '#f3f4f6',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#dc2626',
                              fontFamily: 'Monaco, Consolas, monospace'
                            }}>{children}</code>
                          ) : (
                            <pre style={{
                              backgroundColor: '#1f2937',
                              color: '#f3f4f6',
                              padding: '16px',
                              borderRadius: '8px',
                              overflow: 'auto',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              margin: '16px 0'
                            }}>
                              <code>{children}</code>
                            </pre>
                          )
                        ),
                        pre: ({children}) => (
                          <pre style={{
                            backgroundColor: '#1f2937',
                            color: '#f3f4f6',
                            padding: '16px',
                            borderRadius: '8px',
                            overflow: 'auto',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            margin: '16px 0'
                          }}>
                            {children}
                          </pre>
                        ),
                        img: ({src, alt}) => (
                          <img
                            src={src}
                            alt={alt}
                            style={{
                              maxWidth: '100%',
                              height: 'auto',
                              borderRadius: '8px',
                              margin: '16px 0',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                        ),
                        table: ({children}) => (
                          <div style={{ overflowX: 'auto', margin: '16px 0' }}>
                            <table style={{
                              borderCollapse: 'collapse',
                              width: '100%',
                              border: '1px solid #e5e7eb'
                            }}>
                              {children}
                            </table>
                          </div>
                        ),
                        th: ({children}) => (
                          <th style={{
                            border: '1px solid #e5e7eb',
                            padding: '12px',
                            backgroundColor: '#f9fafb',
                            textAlign: 'left',
                            fontWeight: 'bold'
                          }}>
                            {children}
                          </th>
                        ),
                        td: ({children}) => (
                          <td style={{
                            border: '1px solid #e5e7eb',
                            padding: '12px'
                          }}>
                            {children}
                          </td>
                        ),
                        hr: () => (
                          <hr style={{
                            border: 'none',
                            borderTop: '2px solid #e5e7eb',
                            margin: '24px 0'
                          }} />
                        ),
                        strong: ({children}) => <strong style={{ color: '#1f2937', fontWeight: '600' }}>{children}</strong>,
                        em: ({children}) => <em style={{ fontStyle: 'italic', color: '#6b7280' }}>{children}</em>
                      }}
                    >
                      {formData.content}
                    </ReactMarkdown>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: '#9ca3af'
                    }}>
                      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
                      <div style={{ fontSize: '16px' }}>暂无内容</div>
                      <div style={{ fontSize: '14px', marginTop: '8px' }}>开始编写你的文章吧！</div>
                    </div>
                  )}
                </div>
              ) : (
                <Input.TextArea
                  placeholder="# 开始写作...

在这里分享你的想法、知识和经验。支持 Markdown 语法，可以使用标题、列表、代码块等丰富的格式。"
                  value={formData.content}
                  onChange={(value) => handleFormChange('content', value)}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    minHeight: '400px'
                  }}
                />
              )}
            </Card>
          </div>

          {/* 侧边栏 */}
          <div style={{ width: '320px' }}>
            <Card
              title="文章信息"
              style={{
                marginBottom: '24px',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    字数统计
                  </Text>
                  <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                    {formData.content.length} 字
                  </Text>
                </div>

                <div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    预计阅读时间
                  </Text>
                  <Text style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                    {Math.max(1, Math.ceil(formData.content.length / 400))} 分钟
                  </Text>
                </div>

                <Divider />

                <div>
                  <Text style={{ color: '#666', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    快速操作
                  </Text>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="outline"
                      size="small"
                      style={{ width: '100%' }}
                      onClick={() => navigator.clipboard.writeText(window.location.href)}
                    >
                      复制链接
                    </Button>
                    <Link href={`/blog/${article.slug}`}>
                      <Button
                        type="outline"
                        size="small"
                        style={{ width: '100%' }}
                      >
                        查看原文
                      </Button>
                    </Link>
                  </Space>
                </div>
              </div>
            </Card>

            <Card
              title="写作提示"
              style={{
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#666' }}>
                <p style={{ margin: '0 0 12px 0' }}>💡 <strong>写作建议：</strong></p>
                <ul style={{ margin: '0', paddingLeft: '16px' }}>
                  <li>使用清晰简洁的标题</li>
                  <li>结构化内容，使用标题和列表</li>
                  <li>添加适当的图片和代码示例</li>
                  <li>确保内容逻辑清晰，易于理解</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}