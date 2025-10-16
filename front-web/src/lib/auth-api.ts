import { alova } from './alova';

// TypeScript类型定义

/** 登录请求参数 */
export interface LoginRequest {
  /** 登录密码 */
  password: string;
  /** Token有效期(秒)，仅非生产环境生效 */
  ttl?: number;
}

/** 登录响应数据 */
export interface LoginResponse {
  /** JWT访问令牌 */
  token: string;
  /** 过期时间戳(秒) */
  expiresAt: number;
}

/** 用户信息 */
export interface UserInfo {
  /** 用户名 */
  username: string;
  /** 用户ID */
  id?: string;
}

/** 获取用户信息响应 */
export interface MeResponse {
  /** 用户信息 */
  user: UserInfo;
}

/** 登出响应 */
export interface LogoutResponse {
  /** 登出结果消息 */
  message: string;
}

/** 生成URL Token请求参数 */
export interface GenerateUrlTokenRequest {
  /** 生成token的用途描述 */
  description?: string;
  /** token有效期（秒），0表示使用默认配置 */
  ttl?: number;
  /** token使用方式，如url、header等 */
  token_via?: string;
}

/** 生成URL Token响应数据 */
export interface GenerateUrlTokenResponse {
  /** 生成的JWT token */
  token: string;
  /** 令牌过期时间戳（秒） */
  expires_at: number;
  /** 包含token的登录URL */
  login_url: string;
}

// API接口函数
export const authApi = {
  /**
   * 用户登录
   * @param data 登录请求参数
   */
  login: (data: LoginRequest) => {
    return alova.Post<LoginResponse>('/api/auth/login', data);
  },

  /**
   * 获取当前用户信息
   * 需要认证：自动从alova拦截器中添加Authorization头
   */
  me: () => {
    return alova.Get<MeResponse>('/api/auth/me');
  },

  /**
   * 用户登出
   * 需要认证：自动从alova拦截器中添加Authorization头
   */
  logout: () => {
    return alova.Post<LogoutResponse>('/api/auth/logout');
  },

  /**
   * 生成URL Token（用于URL携带登录）
   * 需要认证：自动从alova拦截器中添加Authorization头
   * @param data 生成URL Token请求参数
   */
  generateUrlToken: (data?: GenerateUrlTokenRequest) => {
    return alova.Post<GenerateUrlTokenResponse>('/api/auth/generate-url-token', data || {});
  },
};

// 导出类型以供其他文件使用
export type {
  LoginRequest,
  LoginResponse,
  UserInfo,
  MeResponse,
  LogoutResponse,
  GenerateUrlTokenRequest,
  GenerateUrlTokenResponse,
};