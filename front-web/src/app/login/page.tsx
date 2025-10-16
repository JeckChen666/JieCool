"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Space, Card, Message, Typography } from "@arco-design/web-react";
import { setToken } from "@/lib/token";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // JWT 格式基础验证
  const isValidJwtFormat = (token: string): boolean => {
    return token.split('.').length === 3;
  };

  // 验证 Token 并处理跳转
  const validateTokenAndRedirect = async (token: string) => {
    try {
      // 先存储token
      setToken(token);
      
      // 验证token有效性，手动添加Authorization头部
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        // Token 有效，跳转到目标页面
        console.log('URL Token 登录成功');
        Message.success('URL Token 登录成功');
        const next = params.get("next") || "/admin/config/manage";
        router.push(next);
      } else {
        // Token 无效，清除并显示错误
        localStorage.removeItem('token');
        setError('Token 无效或已过期，请重新登录');
        Message.error('Token 无效或已过期，请重新登录');
      }
    } catch (error) {
      localStorage.removeItem('token');
      setError('Token 验证失败，请重新登录');
      Message.error('Token 验证失败，请重新登录');
    }
  };

  // 检查 URL 中的 token 参数并自动登录
  const handleUrlToken = React.useCallback(() => {
    const urlToken = params.get('token');
    
    if (urlToken) {
      // 1. 验证 Token 格式（基础检查）
      if (isValidJwtFormat(urlToken)) {
        // 2. 清除 URL 中的 token 参数（避免泄露）
        const newUrl = window.location.pathname + 
          (params.get('next') ? '?next=' + encodeURIComponent(params.get('next')!) : '');
        window.history.replaceState({}, '', newUrl);
        
        // 3. 验证 Token 并处理跳转
        validateTokenAndRedirect(urlToken);
      } else {
        setError('Token 格式无效');
        Message.error('Token 格式无效');
      }
    }
  }, [params, router]);

  // 页面加载时检查URL token
  React.useEffect(() => {
    handleUrlToken();
  }, [handleUrlToken]);

  const onSubmit = async (values: { password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: values.password }),
      });
      const data = await resp.json();
      if (resp.status === 401) {
        throw new Error(data?.message || "未授权");
      }
      const token = data?.token;
      const expiresAt = data?.expiresAt;
      if (!token) {
        throw new Error(data?.message || "登录失败");
      }
      // 同步存储到 localStorage 与 Cookie
      setToken(token, typeof expiresAt === "number" ? expiresAt : undefined);
      Message.success("登录成功");
      const next = params.get("next") || "/admin/config/manage";
      router.push(next);
    } catch (e: any) {
      setError(e?.message || "登录失败");
      Message.error(e?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <Card style={{ width: 380 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={16}>
          <Typography.Title heading={4}>登录</Typography.Title>
          <Typography.Text type="secondary">请输入密码以进入管理后台</Typography.Text>
          {error && <Typography.Text style={{ color: "#cf1322" }}>{error}</Typography.Text>}
          <Form layout="vertical" onSubmit={onSubmit}>
            <Form.Item label="密码" field="password" rules={[{ required: true, message: "请输入密码" }]}> 
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} long>
                登录
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}