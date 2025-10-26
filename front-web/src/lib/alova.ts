"use client";

import {createAlova} from "alova";
import ReactHook from "alova/react";
import adapterFetch from "alova/fetch";
import {clearToken, getToken} from "./token";
import { Message } from '@arco-design/web-react';

// 全局 alova 实例配置
// 注意：仅在客户端组件中使用 useRequest/useFetcher 等 Hook
// baseURL 直接指向后端服务器
export const alova = createAlova({
    // 设置为null即可全局关闭全部请求缓存
    cacheFor: null,
    // 直接指向后端服务器，不再通过前端代理
    baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080",
    statesHook: ReactHook,
    requestAdapter: adapterFetch(),
    // 请求拦截器
    beforeRequest(method) {
        // 例如为请求头添加 token
        const token = typeof window !== "undefined" ? getToken() || undefined : undefined;
        if (token) {
            method.config.headers = {...(method.config.headers || {}), Authorization: `Bearer ${token}`};
        }
        
        // 过滤GET请求中的空值参数，避免拼接到URL上
        if (method.type === 'GET' && method.config.params) {
            const filteredParams = Object.entries(method.config.params).reduce((acc, [key, value]) => {
                // 保留非空值、非undefined、非null的参数
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {} as Record<string, any>);
            
            method.config.params = filteredParams;
        }
    },
    // 响应拦截器
    responded: {
        // 成功响应处理
        onSuccess: async (response) => {
            // 统一处理未授权，跳转登录
            if (response.status === 401 && typeof window !== "undefined") {
                console.log("未授权")
                try {
                    clearToken();
                } catch {
                }
                const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
                if (window.location.pathname !== "/login") {
                    window.location.assign(`/login?next=${next}`);
                }
                throw new Error("未授权");
            }
            if (response.status === 502) {
                console.log("502")
            }
            // fetch 响应默认需手动解析
            const result = await response.json();

            // 检查后端返回的标准格式
            if (result && typeof result === 'object' && 'code' in result) {
                if (result.code === 0) {
                    // 成功响应，返回 data 字段
                    return result.data || result;
                } else {
                    // 业务错误，抛出异常
                    const errorMessage = result.message || '请求失败';
                    Message.error(errorMessage);
                    throw new Error(errorMessage);
                }
            }

            // 如果不是标准格式，直接返回
            return result;
        },
        // 错误响应处理
        onError: (error) => {
            console.error('API请求错误:', error);
            // 显示全局错误提示
            const errorMessage = error.message || '网络请求失败，请稍后重试';
            Message.error(errorMessage);
            return Promise.reject(error);
        },
    },
});

// 便捷方法封装（可选）
export const GET = (url: string, config?: Record<string, any>) => alova.Get(url, config);
export const POST = (url: string, data?: any, config?: Record<string, any>) => alova.Post(url, data, config);
export const PUT = (url: string, data?: any, config?: Record<string, any>) => alova.Put(url, data, config);
export const DELETE = (url: string, config?: Record<string, any>) => alova.Delete(url, config);
export const BASE_URL = alova.options.baseURL;