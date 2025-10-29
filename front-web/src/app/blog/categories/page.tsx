'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Input, Modal, Form, Message, Typography, Spin, Space, Popconfirm, Table, Tag } from '@arco-design/web-react'
import { IconPlus, IconEdit, IconDelete, IconRefresh } from '@arco-design/web-react/icon'
import { blogApi } from '@/lib/blog-api'
import type { BlogCategory, CreateCategoryRequest } from '@/types/blog'
import Link from 'next/link'

const { Title, Text } = Typography

export default function BlogCategoriesManagePage() {
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null)
  const [form] = Form.useForm()

  // 获取分类列表
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await blogApi.getCategories()
      const categoriesList = response?.list || []
      console.log('获取到的分类数据:', categoriesList)
      setCategories(categoriesList)
    } catch (error) {
      console.error('获取分类失败:', error)
      Message.error('获取分类列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 打开新增分类模态框
  const handleAddCategory = () => {
    setEditingCategory(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 打开编辑分类模态框
  const handleEditCategory = (category: BlogCategory) => {
    setEditingCategory(category)
    form.setFieldsValue({
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder
    })
    setModalVisible(true)
  }

  // 删除分类
  const handleDeleteCategory = async (categoryId: number) => {
    try {
      // TODO: 需要在后端添加删除分类的API
      Message.success('删除功能开发中...')
    } catch (error) {
      console.error('删除分类失败:', error)
      Message.error('删除分类失败')
    }
  }

  // 保存分类
  const handleSaveCategory = async () => {
    try {
      const values = await form.validate()

      if (editingCategory) {
        // TODO: 需要在后端添加更新分类的API
        Message.success('更新功能开发中...')
      } else {
        const categoryData: CreateCategoryRequest = {
          name: values.name,
          slug: values.slug || values.name.toLowerCase().replace(/\s+/g, '-'),
          description: values.description,
          sortOrder: values.sortOrder || 0
        }

        await blogApi.createCategory(categoryData)
        Message.success('分类创建成功')
        setModalVisible(false)
        form.resetFields()
        fetchCategories()
      }
    } catch (error) {
      console.error('保存分类失败:', error)
      Message.error('保存分类失败')
    }
  }

  // 表格列配置
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a: BlogCategory, b: BlogCategory) => a.id - b.id
    },
    {
      title: '分类名称',
      dataIndex: 'name',
      render: (name: string, record: BlogCategory) => (
        <div>
          <Text style={{ fontWeight: 500 }}>{name}</Text>
          {record.articleCount > 0 && (
            <Tag color="blue" size="small" style={{ marginLeft: 8 }}>
              {record.articleCount} 篇文章
            </Tag>
          )}
        </div>
      ),
      sorter: (a: BlogCategory, b: BlogCategory) => a.name.localeCompare(b.name)
    },
    {
      title: 'URL标识',
      dataIndex: 'slug',
      render: (slug: string) => <Text style={{ color: '#666', fontFamily: 'monospace' }}>{slug}</Text>
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Text style={{ color: '#666' }}>
          {description || '-'}
        </Text>
      )
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
      sorter: (a: BlogCategory, b: BlogCategory) => a.sortOrder - b.sortOrder
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN')
    },
    {
      title: '操作',
      width: 150,
      render: (_: any, record: BlogCategory) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<IconEdit />}
            onClick={() => handleEditCategory(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            content={`确定要删除分类"${record.name}"吗？`}
            onOk={() => handleDeleteCategory(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              status="danger"
              icon={<IconDelete />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title heading={1} style={{ marginBottom: '16px' }}>
          博客分类管理
        </Title>
        <Text style={{ color: '#666' }}>
          管理博客文章分类，创建和编辑分类信息
        </Text>
      </div>

      {/* 操作栏 */}
      <div style={{ marginBottom: '24px', background: '#fff', padding: '24px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/blog">
              <Button type="text" icon={<IconRefresh />}>
                返回博客
              </Button>
            </Link>
            <Text style={{ color: '#666' }}>
              共 {categories.length} 个分类
            </Text>
          </div>

          <Space>
            <Button
              icon={<IconRefresh />}
              onClick={fetchCategories}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<IconPlus />}
              onClick={handleAddCategory}
            >
              新增分类
            </Button>
          </Space>
        </div>
      </div>

      {/* 分类列表 */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
        bodyStyle={{ padding: '0' }}
      >
        <Table
          columns={columns}
          data={categories}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
          rowKey="id"
        />
      </Card>

      {/* 新增/编辑分类模态框 */}
      <Modal
        title={editingCategory ? '编辑分类' : '新增分类'}
        visible={modalVisible}
        onOk={handleSaveCategory}
        onCancel={() => setModalVisible(false)}
        width={600}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
          <Form.Item
            label="分类名称"
            field="name"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input
              placeholder="输入分类名称..."
              maxLength={50}
              showWordLimit
            />
          </Form.Item>

          <Form.Item
            label="URL标识符"
            field="slug"
            rules={[
              { required: true, message: '请输入URL标识符' },
              { pattern: /^[a-z0-9-]+$/, message: '只能包含小写字母、数字和连字符' }
            ]}
          >
            <Input
              placeholder="url-friendly-identifier"
              prefix={
                <span style={{ color: '#666', fontSize: '14px' }}>
                  /blog/category/
                </span>
              }
              maxLength={50}
              showWordLimit
            />
          </Form.Item>

          <Form.Item
            label="分类描述"
            field="description"
          >
            <Input.TextArea
              placeholder="简要描述这个分类..."
              rows={3}
              maxLength={200}
              showWordLimit
            />
          </Form.Item>

          <Form.Item
            label="排序权重"
            field="sortOrder"
            initialValue={0}
          >
            <Input
              type="number"
              placeholder="数字越小排序越靠前"
              min={0}
              max={9999}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}