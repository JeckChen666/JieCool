"use client";

import { createAlova } from "alova";
import ReactHook from "alova/react";
import adapterFetch from "alova/fetch";

// 全局 alova 实例配置
// 注意：仅在客户端组件中使用 useRequest/useFetcher 等 Hook
// baseURL 读取 NEXT_PUBLIC_API_BASE 环境变量，默认指向本地后端 8080 端口
export const alova = createAlova({
  // 统一通过前端域名发起请求，结合 next.config.js 的 rewrites 进行代理转发
  baseURL: "",
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  // 请求拦截器
  beforeRequest(method) {
    // 例如为请求头添加 token
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
    if (token) {
      method.config.headers = { ...(method.config.headers || {}), Authorization: `Bearer ${token}` };
    }
  },
  // 响应拦截器
  responded: {
    // 成功响应处理
    onSuccess: async (response) => {
      // fetch 响应默认需手动解析
      const result = await response.json();
      
      // 检查后端返回的标准格式
      if (result && typeof result === 'object' && 'code' in result) {
        if (result.code === 0) {
          // 成功响应，返回 data 字段
          return result.data || result;
        } else {
          // 业务错误，抛出异常
          throw new Error(result.message || '请求失败');
        }
      }
      
      // 如果不是标准格式，直接返回
      return result;
    },
    // 错误响应处理
    onError: (error) => {
      console.error('API请求错误:', error);
      return Promise.reject(error);
    },
  },
});

// 便捷方法封装（可选）
export const GET = (url: string, config?: Record<string, any>) => alova.Get(url, config);
export const POST = (url: string, data?: any, config?: Record<string, any>) => alova.Post(url, data, config);
export const PUT = (url: string, data?: any, config?: Record<string, any>) => alova.Put(url, data, config);
export const DELETE = (url: string, config?: Record<string, any>) => alova.Delete(url, config);