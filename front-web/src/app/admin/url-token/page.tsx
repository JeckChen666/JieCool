'use client'

import { useState } from 'react'
import { Card, Button, Input, Message, Typography, Space, Divider } from '@arco-design/web-react'
import { IconCopy, IconRefresh, IconLink } from '@arco-design/web-react/icon'
import { authApi, type GenerateUrlTokenResponse } from '@/lib/auth-api'

const { Title, Text } = Typography

interface UrlTokenData {
  token: string
  expires_at: string
  login_url: string
}

export default function UrlTokenPage() {
  const [tokenData, setTokenData] = useState<UrlTokenData | null>(null)
  const [loading, setLoading] = useState(false)

  // 生成URL token
  const generateToken = async () => {
    setLoading(true)
    
    try {
      // 使用alova接口调用，自动处理认证头和错误
      const data = await authApi.generateUrlToken({
        description: 'URL Token管理页面生成',
        ttl: 3600, // 1小时
        token_via: 'url'
      })
      
      // 构建登录URL
      const loginUrl = `${window.location.origin}/login?token=${data.token}`
      
      setTokenData({
        token: data.token,
        expires_at: data.expires_at.toString(),
        login_url: loginUrl
      })
      
      Message.success('Token生成成功')
    } catch (err: any) {
      // alova的错误处理已经在拦截器中统一处理
      Message.error(err.message || '生成Token失败')
    } finally {
      setLoading(false)
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      Message.success(`${type}已复制到剪贴板`)
    } catch (err) {
      Message.error('复制失败')
    }
  }

  const formatExpiresAt = (expiresAt: string | number) => {
    // 后端返回的是Unix时间戳（秒），需要转换为毫秒
    const timestamp = typeof expiresAt === 'string' ? parseInt(expiresAt) : expiresAt;
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title heading={2}>URL Token 管理</Title>
        <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
          生成临时访问token，用于无需登录的URL访问
        </Text>
      </div>

      <Card 
        title={
          <Space>
            <IconRefresh />
            <span>生成 URL Token</span>
          </Space>
        }
        bordered
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Text type="secondary">
            生成一个临时的访问token，可用于构建无需登录的访问链接。Token有效期为1小时。
          </Text>
          
          <Button 
            type="primary"
            icon={<IconRefresh />}
            loading={loading}
            onClick={generateToken}
          >
            {loading ? '生成中...' : '生成新Token'}
          </Button>

          {tokenData && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: 'var(--color-fill-2)', 
              borderRadius: '6px' 
            }}>
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Token */}
                <div>
                  <Text bold style={{ display: 'block', marginBottom: '8px' }}>
                    Token
                  </Text>
                  <Input.Group compact>
                    <Input
                      style={{ 
                        width: 'calc(100% - 80px)', 
                        fontFamily: 'monospace', 
                        fontSize: '12px' 
                      }}
                      value={tokenData.token}
                      readOnly
                    />
                    <Button
                      icon={<IconCopy />}
                      onClick={() => copyToClipboard(tokenData.token, 'Token')}
                    >
                      复制
                    </Button>
                  </Input.Group>
                </div>

                {/* 过期时间 */}
                <div>
                  <Text bold style={{ display: 'block', marginBottom: '8px' }}>
                    过期时间
                  </Text>
                  <Input
                    value={formatExpiresAt(tokenData.expires_at)}
                    readOnly
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>

                {/* 登录URL */}
                <div>
                  <Text bold style={{ display: 'block', marginBottom: '8px' }}>
                    登录URL
                  </Text>
                  <Space style={{ width: '100%' }}>
                    <Input.Group compact style={{ flex: 1 }}>
                      <Input
                        style={{ 
                          width: 'calc(100% - 160px)', 
                          fontFamily: 'monospace', 
                          fontSize: '12px' 
                        }}
                        value={tokenData.login_url}
                        readOnly
                      />
                      <Button
                        icon={<IconCopy />}
                        onClick={() => copyToClipboard(tokenData.login_url, '登录URL')}
                      >
                        复制
                      </Button>
                      <Button
                        icon={<IconLink />}
                        onClick={() => window.open(tokenData.login_url, '_blank')}
                      >
                        打开
                      </Button>
                    </Input.Group>
                  </Space>
                </div>

                <Divider />

                {/* 使用说明 */}
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: 'var(--color-primary-light-1)', 
                  borderRadius: '4px' 
                }}>
                  <Text bold style={{ display: 'block', marginBottom: '8px' }}>
                    使用说明
                  </Text>
                  <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                    <div>• Token有效期为1小时，过期后需要重新生成</div>
                    <div>• 登录URL可以直接在浏览器中打开，无需手动输入密码</div>
                    <div>• Token可以用于API调用的Authorization头部</div>
                    <div>• 请妥善保管Token，避免泄露给他人</div>
                  </div>
                </div>
              </Space>
            </div>
          )}
        </Space>
      </Card>
    </div>
  )
}