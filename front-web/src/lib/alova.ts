"use client";

import { createAlova } from "alova";
import ReactHook from "alova/react";
import adapterFetch from "alova/fetch";

// 全局 alova 实例配置
// 注意：仅在客户端组件中使用 useRequest/useFetcher 等 Hook
// baseURL 读取 NEXT_PUBLIC_API_BASE 环境变量，默认指向本地后端 8080 端口
export const alova = createAlova({
  baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080",
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  // 预留拦截器（按需开启）
  // beforeRequest(method) {
  //   // 例如为请求头添加 token
  //   const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
  //   if (token) {
  //     method.config.headers = { ...(method.config.headers || {}), Authorization: `Bearer ${token}` };
  //   }
  // },
  // responded: {
  //   // 示例：统一处理响应
  //   // onSuccess: async (response) => {
  //   //   // fetch 响应默认需手动解析
  //   //   const data = await response.json();
  //   //   return data;
  //   // },
  //   // onError: (error) => {
  //   //   return Promise.reject(error);
  //   // },
  // },
});

// 便捷方法封装（可选）
export const GET = (url: string, config?: Record<string, any>) => alova.Get(url, config);
export const POST = (url: string, data?: any, config?: Record<string, any>) => alova.Post(url, data, config);
export const PUT = (url: string, data?: any, config?: Record<string, any>) => alova.Put(url, data, config);
export const DELETE = (url: string, config?: Record<string, any>) => alova.Delete(url, config);