"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Form, Input, Button, Space, Card, Message, Typography } from "@arco-design/web-react";
import { setToken } from "@/lib/token";
import { authApi, type LoginRequest } from "@/lib/auth-api";

function LoginPageContent() {
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
      console.log('token', token)
      // 使用auth-api验证token有效性
      await authApi.me();
      
      // Token 有效，跳转到目标页面
      console.log('URL Token 登录成功');
      Message.success('URL Token 登录成功');
      const next = params.get("next") || "/admin/config/manage";
      router.push(next);
    } catch (error) {
      // Token 无效，清除并显示错误
      localStorage.removeItem('token');
      setError('Token 无效或已过期，请重新登录');
      Message.error('Token 无效或已过期，请重新登录');
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
      // 构造登录请求参数
      const loginRequest: LoginRequest = {
        password: values.password
      };
      
      // 使用auth-api进行登录
      const response = await authApi.login(loginRequest);
      console.log(response)
      const { token, expiresAt } = response;
      
      if (!token) {
        throw new Error("登录失败：未获取到有效令牌");
      }
      
      // 同步存储到 localStorage 与 Cookie
      setToken(token, typeof expiresAt === "number" ? expiresAt : undefined);
      Message.success("登录成功");
      const next = params.get("next") || "/admin/config/manage";
      router.push(next);
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || "登录失败";
      setError(errorMessage);
      Message.error(errorMessage);
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div>Loading...</div>
    </div>}>
      <LoginPageContent />
    </Suspense>
  );
}