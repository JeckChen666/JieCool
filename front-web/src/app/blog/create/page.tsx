'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Form, Input, Button, Message, Typography } from '@arco-design/web-react'
import { IconSave } from '@arco-design/web-react/icon'
import { blogApi } from '@/lib/blog-api'
import type { CreateArticleRequest, BlogCategory } from '@/types/blog'
import Link from 'next/link'

const { Title, Text } = Typography

export default function CreateBlogPage() {
  const router = useRouter()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BlogCategory[]>([])

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await blogApi.getCategories()
      setCategories(response.data || [])
    } catch (error) {
      console.error('获取分类失败:', error)
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

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Title heading={1} className="text-center mb-4">
          创建博客文章
        </Title>
        <Text className="text-center text-gray-600">
          分享你的见解和经验
        </Text>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <Form form={form} layout="vertical">
            <Form.Item label="文章标题" field="title" rules={[{ required: true, message: '请输入文章标题' }]}>
              <Input placeholder="请输入文章标题" />
            </Form.Item>

            <Form.Item label="URL标识" field="slug">
              <Input placeholder="url-friendly-identifier" />
            </Form.Item>

            <Form.Item label="文章摘要" field="summary">
              <Input.TextArea placeholder="请输入文章摘要" rows={3} />
            </Form.Item>

            <Form.Item label="文章内容" field="content" rules={[{ required: true, message: '请输入文章内容' }]}>
              <Input.TextArea placeholder="请输入文章内容（支持Markdown）" rows={15} />
            </Form.Item>

            <Form.Item>
              <div className="flex gap-4">
                <Button
                  type="primary"
                  loading={loading}
                  onClick={handleSaveDraft}
                  icon={<IconSave />}
                >
                  保存草稿
                </Button>
                <Link href="/blog">
                  <Button>取消</Button>
                </Link>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}