'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Button, Message, Typography, Spin, Space, Divider, Select } from '@arco-design/web-react'
import { IconSave, IconEdit, IconEye, IconArrowLeft } from '@arco-design/web-react/icon'
import { blogApi } from '@/lib/blog-api'
import type { CreateArticleRequest, BlogCategory } from '@/types/blog'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

const { Title, Text } = Typography

export default function CreateBlogPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])
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
      console.log('开始获取分类...')
      const response = await blogApi.getCategories()
      const categoriesList = response?.list || []
      console.log('获取到的分类数据:', categoriesList)
      console.log('分类数据长度:', categoriesList.length)
      console.log('设置分类状态...')
      setCategories(categoriesList)
      console.log('分类状态设置完成')

      // 强制更新组件状态
      setTimeout(() => {
        console.log('延迟检查 - 分类数据:', categoriesList)
      }, 100)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  // 表单数据变化处理
  const handleFormChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)

    // 同时更新表单字段值，确保 form.validate() 能获取到正确的值
    form.setFieldValue(field, value)

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

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      const articleData: CreateArticleRequest = {
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/\s+/g, '-'),
        summary: values.summary,
        content: values.content,
        categoryId: values.categoryId || 1,
        tags: [],
        status: 'draft',
        isDraft: true
      }

      await blogApi.createArticle(articleData)
      Message.success('草稿保存成功')
      router.push('/blog')
    } catch (error) {
      console.error('保存草稿失败:', error)
      Message.error('保存草稿失败')
    } finally {
      setLoading(false)
    }
  }

  // 发布文章
  const handlePublish = async () => {
    try {
      const values = await form.validate()
      setLoading(true)

      const articleData: CreateArticleRequest = {
        title: values.title,
        slug: values.slug || values.title.toLowerCase().replace(/\s+/g, '-'),
        summary: values.summary,
        content: values.content,
        categoryId: values.categoryId || 1,
        tags: [],
        status: 'published',
        isDraft: false
      }

      const response = await blogApi.createArticle(articleData)
      Message.success('文章发布成功')
      router.push(`/blog/${response.slug}`)
    } catch (error) {
      console.error('发布失败:', error)
      Message.error('发布文章失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算字数和阅读时间
  const calculateStats = (content: string) => {
    const wordCount = content.length
    const readTime = Math.max(1, Math.ceil(wordCount / 200))
    return { wordCount, readTime }
  }

  const stats = calculateStats(formData.content)

  useEffect(() => {
    console.log('useEffect触发，开始获取分类')
    fetchCategories()

    // 初始化表单字段值
    form.setFieldsValue({
      title: '',
      slug: '',
      summary: '',
      content: '',
      categoryId: undefined
    })
  }, [])

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
              <Link href="/blog">
                <Button
                  type="text"
                  icon={<IconArrowLeft />}
                  style={{ color: '#666' }}
                >
                  返回博客
                </Button>
              </Link>
              <div>
                <Title heading={3} style={{ margin: 0, color: '#333' }}>
                  创建文章
                </Title>
                <Text style={{ color: '#666', fontSize: '14px' }}>
                  开始创作你的新文章
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
                onClick={handleSaveDraft}
                style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}
              >
                保存草稿
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handlePublish}
                icon={<IconSave />}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                发布文章
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

                <Form.Item
                  label={
                    <span style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                      文章分类
                    </span>
                  }
                  field="categoryId"
                  rules={[{ required: true, message: '请选择文章分类' }]}
                >
                    <Select
                        placeholder="选择一个分类..."
                        style={{
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb'
                        }}
                        allowClear
                        loading={categories.length === 0}
                        options={categories && categories.length > 0 ? categories.map(category => ({
                            label: category.name,
                            value: category.id
                        })) : []}
                        notFoundContent={categories.length === 0 ? "加载中..." : "暂无分类"}
                    />
                </Form.Item>

                {/* 隐藏的 content 字段，用于表单验证 */}
                <Form.Item field="content" style={{ display: 'none' }}>
                  <Input />
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
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      h1: ({children}) => <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '24px 0 16px', color: '#1f2937', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>{children}</h1>,
                      h2: ({children}) => <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '20px 0 14px', color: '#374151' }}>{children}</h2>,
                      h3: ({children}) => <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '18px 0 12px', color: '#4b5563' }}>{children}</h3>,
                      p: ({children}) => <p style={{ marginBottom: '16px', lineHeight: '1.8' }}>{children}</p>,
                      blockquote: ({children}) => (
                        <blockquote style={{
                          borderLeft: '4px solid #3b82f6',
                          paddingLeft: '16px',
                          margin: '16px 0',
                          color: '#6b7280',
                          fontStyle: 'italic',
                          background: '#f8fafc',
                          padding: '12px 16px',
                          borderRadius: '0 8px 8px 0'
                        }}>
                          {children}
                        </blockquote>
                      ),
                      code: ({inline, children}) => (
                        inline ? (
                          <code style={{
                            backgroundColor: '#f1f5f9',
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
                      ul: ({children}) => <ul style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ul>,
                      ol: ({children}) => <ol style={{ marginBottom: '16px', paddingLeft: '20px' }}>{children}</ol>,
                      li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                      strong: ({children}) => <strong style={{ color: '#1f2937', fontWeight: '600' }}>{children}</strong>,
                      em: ({children}) => <em style={{ color: '#4b5563', fontStyle: 'italic' }}>{children}</em>,
                      hr: () => <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '24px 0' }} />,
                      table: ({children}) => (
                        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '16px 0', fontSize: '14px' }}>
                          {children}
                        </table>
                      ),
                      thead: ({children}) => (
                        <thead style={{ background: '#f8fafc' }}>
                          {children}
                        </thead>
                      ),
                      th: ({children}) => (
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          borderBottom: '2px solid #e5e7eb',
                          fontWeight: '600',
                          color: '#374151'
                        }}>
                          {children}
                        </th>
                      ),
                      td: ({children}) => (
                        <td style={{
                          padding: '12px',
                          borderBottom: '1px solid #e5e7eb',
                          verticalAlign: 'top'
                        }}>
                          {children}
                        </td>
                      )
                    }}
                  >
                    {formData.content || '# 开始写作...\n\n在这里分享你的想法、知识和经验。支持 Markdown 语法，可以使用标题、列表、代码块等丰富的格式。'}
                  </ReactMarkdown>
                </div>
              ) : (
                <Input.TextArea
                  placeholder="# 开始写作...
在这里分享你的想法、知识和经验。支持 Markdown 语法，可以使用标题、列表、代码块等丰富的格式。"
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    minHeight: '400px',
                    fontSize: '15px',
                    lineHeight: '1.6',
                    padding: '16px',
                    fontFamily: 'Monaco, Consolas, monospace'
                  }}
                  onChange={(value) => handleFormChange('content', value)}
                />
              )}
            </Card>
          </div>

          {/* 侧边栏 */}
          <div style={{ width: '300px' }}>
            <Card title="文章信息" style={{ marginBottom: '20px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#666' }}>字数统计</Text>
                  <Text style={{ fontWeight: '500' }}>{stats.wordCount} 字</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#666' }}>预计阅读时间</Text>
                  <Text style={{ fontWeight: '500' }}>{stats.readTime} 分钟</Text>
                </div>
              </Space>
            </Card>

            <Card title="快速操作" style={{ marginBottom: '20px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="outline"
                  style={{ width: '100%' }}
                  icon={<IconEye />}
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? '返回编辑' : '预览效果'}
                </Button>
                <Link href="/blog">
                  <Button style={{ width: '100%' }}>
                    返回列表
                  </Button>
                </Link>
              </Space>
            </Card>

            <Card title="写作提示">
              <div style={{ color: '#666', fontSize: '14px' }}>
                <div style={{ marginBottom: '8px' }}>💡 <strong>写作建议：</strong></div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  <li style={{ marginBottom: '4px' }}>使用清晰简洁的标题</li>
                  <li style={{ marginBottom: '4px' }}>结构化内容，使用标题和列表</li>
                  <li style={{ marginBottom: '4px' }}>添加适当的代码示例</li>
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