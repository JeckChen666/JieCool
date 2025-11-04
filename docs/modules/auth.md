# 鉴权模块（Auth Module）

## 模块目标

实现单用户密码登录的鉴权体系，支持多端同时在线，通过 JWT Token 区分公共资源与私有资源的访问权限。当密码更新时，所有既有会话强制失效，需重新登录。

### 核心目标
- **单用户认证**：仅支持管理员（我本人）登录，无需复杂的用户管理系统
- **Token 鉴权**：基于 JWT（HS256）实现无状态认证
- **多端支持**：允许多个设备同时保持登录状态
- **统一失效**：密码修改后所有 Token 立即失效
- **前后端分离**：后端提供 API，前端通过 BFF 代理调用

## 功能点

### 1. 登录认证
- **密码验证**：校验用户输入密码与动态配置中的密码是否匹配
- **JWT 签发**：验证成功后生成包含用户身份信息的 JWT Token
- **TTL 控制**：支持自定义 Token 有效期（非生产环境可设置短期 TTL 用于测试）
- **统一响应**：返回标准化的响应格式 `{ code, message, data }`

### 2. Token 验证
- **Bearer Token**：支持 HTTP Header `Authorization: Bearer <token>` 方式传递
- **URL Token**：支持通过 URL 参数 `?token=xxx` 传递（用于静默登录场景）
- **Token 解析**：验证 JWT 签名、过期时间和签发时间
- **失效检查**：比较 Token 签发时间与密码更新时间，确保密码修改后 Token 失效

#### Token 验证详细流程

**1. Token 提取（中间件层）**
```go
// 优先级：URL token > Authorization Header
token := r.GetQuery("token").String()
if token == "" {
    authz := r.Header.Get("Authorization")
    if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
        token = strings.TrimSpace(authz[7:])
    }
}
```

#### URL Token 登录详细机制

**使用场景**：
- **静默登录**：用户点击邮件链接直接访问受保护页面
- **跨设备登录**：通过二维码或链接在其他设备上快速登录
- **开发调试**：开发环境下快速切换登录状态
- **API 测试**：在浏览器中直接测试需要认证的接口

**URL Token 格式**：
```
https://example.com/protected-page?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
https://example.com/api/auth/me?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**提取优先级**：
1. **URL 参数优先**：`?token=xxx` 参数具有最高优先级
2. **Header 兜底**：URL 中无 token 时才检查 `Authorization: Bearer` 头
3. **来源标记**：系统会记录 Token 来源（`auth.via: "url"` 或 `"header"`）

**安全考虑**：
- **URL 可见性**：URL Token 在浏览器历史、服务器日志中可见
- **传输安全**：必须使用 HTTPS 防止 Token 在传输中泄露
- **有效期控制**：URL Token 建议设置较短的有效期
- **一次性使用**：重要操作建议 Token 仅使用一次后失效（当前未实现）

**实现细节**：
```go
// 中间件中的 Token 提取逻辑
func MiddlewareJWT(r *ghttp.Request) {
    // 1. 优先从 URL 参数获取
    token := r.GetQuery("token").String()
    
    // 2. URL 中无 token 时从 Header 获取
    if token == "" {
        authz := r.Header.Get("Authorization")
        if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
            token = strings.TrimSpace(authz[7:])
        }
    }
    
    // 3. 验证 Token（与 Header Token 验证逻辑相同）
    claims, err := auth.ValidateToken(r.GetCtx(), token)
    
    // 4. 标记 Token 来源
    if r.GetQuery("token").String() != "" {
        r.SetCtxVar("auth.via", "url")    // URL 来源
    } else {
        r.SetCtxVar("auth.via", "header") // Header 来源
    }
}
```

**2. JWT 解析与验证（服务层）**
```go
// 使用动态配置中的 JWT 密钥解析 Token
parsed, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
    return []byte(secret), nil
})

// 验证解析结果和 Token 有效性
if err != nil || !parsed.Valid {
    return nil, ErrUnauthorized
}
```

**3. 签名算法验证**
- 使用 HS256 对称加密算法
- JWT 密钥从动态配置 `auth/<env>/jwt_secret` 获取
- 密钥支持运行时动态更新

**4. 时间有效性验证**
```go
// JWT 标准时间验证（自动进行）
// - IssuedAt: 签发时间不能晚于当前时间
// - ExpiresAt: 过期时间不能早于当前时间
```

**5. 密码更新失效验证**
```go
// 获取密码最后更新时间
pwdUpdatedAt := getPasswordUpdatedAt(ctx) // 从 auth/<env>/password_updated_at 获取

// 比较 Token 签发时间与密码更新时间
if pwdUpdatedAt > 0 {
    iat := claims.IssuedAt.Unix()
    if iat < pwdUpdatedAt {
        return nil, ErrUnauthorized // Token 在密码更新前签发，强制失效
    }
}
```

**6. 上下文注入**
```go
// 验证成功后，将认证信息注入请求上下文
r.SetCtxVar("auth.subject", claims.Subject)     // 用户标识
r.SetCtxVar("auth.iat", iat)                    // 签发时间
r.SetCtxVar("auth.exp", exp)                    // 过期时间
r.SetCtxVar("auth.via", "header"|"url")         // Token 来源
```

**7. 公共接口跳过验证**
```go
// 检查路由元数据标签
if strings.EqualFold(getMetaTag(r, "noAuth"), "true") {
    r.Middleware.Next() // 跳过验证，直接处理请求
    return
}
```

#### 验证失败处理

**失败场景**：
- Token 为空或格式错误
- JWT 签名验证失败
- Token 已过期
- Token 在密码更新前签发
- JWT 密钥配置缺失

**统一响应**：
- HTTP 状态码：401 Unauthorized
- 前端接收到 401 后自动清除本地 Token 并跳转登录页

### 3. 用户信息获取
- **当前用户**：通过 `/auth/me` 接口获取当前登录用户信息
- **上下文注入**：将认证信息注入到请求上下文中，便于控制器使用

### 4. 登出功能
- **客户端登出**：前端清除本地存储的 Token
- **Token 验证**：后端验证 Token 有效性后返回成功响应

### 5. 权限控制
- **公共接口**：通过 `g.Meta` 标签 `noAuth:"true"` 标记无需认证的接口
- **私有接口**：默认需要认证，通过中间件统一拦截验证
- **路由守卫**：前端对受保护页面进行登录状态检查

## 数据流

### 1. 登录流程
```
用户输入密码 → 前端 BFF (/api/auth/login) → 后端 API (/auth/login)
                ↓
密码验证 → JWT 签发 → 返回 Token → 前端存储 (localStorage + Cookie)
```

### 2. 认证流程
```
前端请求 → 自动添加 Authorization Header → 后端中间件验证
                ↓
Token 解析 → 签名验证 → 过期检查 → 失效检查 → 注入上下文 → 继续处理
```

#### 详细验证流程图
```
请求到达中间件
        ↓
检查是否为公共接口 (noAuth:"true")
        ↓ (否)
提取 Token (URL参数 > Authorization Header)
        ↓
Token 是否存在？
        ↓ (是)
调用 auth.ValidateToken()
        ↓
获取 JWT 密钥 (auth/<env>/jwt_secret)
        ↓
使用 HS256 解析 JWT
        ↓
验证 JWT 签名是否正确？
        ↓ (是)
验证 Token 是否过期？
        ↓ (否，未过期)
获取密码更新时间 (auth/<env>/password_updated_at)
        ↓
Token 签发时间 >= 密码更新时间？
        ↓ (是)
提取 Claims 信息
        ↓
注入认证信息到请求上下文
        ↓
继续处理业务逻辑

任何验证失败 → 返回 401 Unauthorized → 前端清除 Token → 跳转登录页
```

### 3. 失效流程
```
密码更新 → 更新 password_updated_at → 所有旧 Token 失效
                ↓
下次请求 → Token 验证失败 → 返回 401 → 前端清除 Token → 跳转登录页
```

## 代码设计

### 1. 后端架构

#### API 层 (`server/api/auth/v1/auth.go`)
```go
// 定义认证相关的请求和响应结构
type LoginReq struct {
    g.Meta   `path:"/auth/login" method:"post" tags:"认证" summary:"用户登录"`
    Password string `json:"password" v:"required" dc:"登录密码"`
    TTL      int    `json:"ttl" dc:"Token有效期(秒)，仅非生产环境生效"`
}

type LoginRes struct {
    Token     string `json:"token" dc:"JWT访问令牌"`
    ExpiresAt int64  `json:"expiresAt" dc:"过期时间戳(秒)"`
}
```

#### 控制器层 (`server/internal/controller/auth/`)
- **auth_v1_login.go**：处理登录请求，验证密码并签发 JWT
- **auth_v1_me.go**：获取当前用户信息，验证 Token 有效性
- **auth_v1_logout.go**：处理登出请求，验证 Token 后返回成功响应

#### 服务层 (`server/internal/service/auth/jwt.go`)
```go
// JWT 服务核心功能
type Claims struct {
    Subject   string `json:"sub"`
    IssuedAt  int64  `json:"iat"`
    ExpiresAt int64  `json:"exp"`
}

// 生成 JWT Token
func GenerateToken(ctx context.Context, subject string, ttl ...int) (string, int64, error)

// 验证 JWT Token
func ValidateToken(ctx context.Context, tokenString string) (*Claims, error)
```

#### 中间件层 (`server/internal/middleware/jwt.go`)
```go
// JWT 认证中间件
func MiddlewareJWT(r *ghttp.Request) {
    // 1. 检查是否为公共接口 (noAuth:"true")
    // 2. 提取 Token (Authorization Header 或 URL 参数)
    // 3. 验证 Token 有效性
    // 4. 注入认证信息到上下文
    // 5. 继续处理请求或返回 401
}
```

### 2. 前端架构

#### BFF 代理层 (`front-web/src/app/api/auth/`)
- **login/route.ts**：代理登录请求到后端，处理统一响应格式
- **me/route.ts**：代理用户信息请求，传递 Authorization Header
- **logout/route.ts**：代理登出请求，处理响应并返回登出状态

#### Token 管理 (`front-web/src/lib/token.ts`)
```typescript
// Token 存取工具，支持 localStorage 和 Cookie 双重存储
export function getToken(): string | null
export function setToken(token: string, expiresAt?: number): void
export function clearToken(): void
```

#### 请求拦截器 (`front-web/src/lib/alova.ts`)
```typescript
// 自动为需要认证的请求添加 Authorization Header
beforeRequest(method) {
    const token = getToken();
    if (token) {
        method.config.headers = { 
            ...method.config.headers, 
            Authorization: `Bearer ${token}` 
        };
    }
}
```

#### 响应拦截器（Token 失效处理）
```typescript
// 统一处理 401 未授权响应
responded: {
    onSuccess: async (response) => {
        // 检测到 401 状态码
        if (response.status === 401 && typeof window !== "undefined") {
            try {
                clearToken(); // 清除本地 Token
            } catch {}
            
            // 保存当前页面路径，登录后跳转回来
            const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
            
            // 避免在登录页重复跳转
            if (window.location.pathname !== "/login") {
                window.location.assign(`/login?next=${next}`);
            }
            throw new Error("未授权");
        }
        
        // 处理业务响应格式
        const result = await response.json();
        if (result && typeof result === 'object' && 'code' in result) {
            if (result.code === 0) {
                return result.data || result; // 成功响应
            } else {
                throw new Error(result.message || '请求失败'); // 业务错误
            }
        }
        return result;
    }
}
```

#### URL Token 自动处理（前端）

**实现位置**：应用初始化或页面加载时
```typescript
// 检查 URL 中的 token 参数并自动登录
function handleUrlToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
        // 1. 验证 Token 格式（基础检查）
        if (isValidJwtFormat(urlToken)) {
            // 2. 存储 Token 到本地
            setToken(urlToken);
            
            // 3. 清除 URL 中的 token 参数（避免泄露）
            urlParams.delete('token');
            const newUrl = window.location.pathname + 
                (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', newUrl);
            
            // 4. 可选：验证 Token 有效性
            validateTokenAndRedirect();
        }
    }
}

// JWT 格式基础验证
function isValidJwtFormat(token: string): boolean {
    return token.split('.').length === 3;
}

// 验证 Token 并处理跳转
async function validateTokenAndRedirect() {
    try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
            // Token 有效，可以继续访问当前页面
            console.log('URL Token 登录成功');
        } else {
            // Token 无效，清除并跳转登录页
            clearToken();
            window.location.href = '/login';
        }
    } catch (error) {
        clearToken();
        window.location.href = '/login';
    }
}
```

**使用场景示例**：
```
# 邮件链接直接访问受保护页面
https://example.com/admin/config/manage?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API 测试链接
https://example.com/api/auth/me?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 跨设备登录链接
https://example.com/dashboard?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 登录页面 (`front-web/src/app/login/page.tsx`)
- 密码输入表单
- 登录状态管理
- 成功后跳转到目标页面
- 错误处理和用户提示

### 3. 数据存储

#### 动态配置存储
- **密码配置**：`core/dev/keyPassword` - 当前登录密码（明文存储）
- **JWT 密钥**：`auth/<env>/jwt_secret` - JWT 签名密钥
- **密码更新时间**：`auth/<env>/password_updated_at` - Unix 时间戳，用于 Token 失效判断

#### 前端存储
- **localStorage**：主要存储方式，持久化 Token
- **Cookie**：兜底存储方式，设置过期时间与 Token 一致
- **内存状态**：登录状态、用户信息等临时数据

## 使用方法

### 1. 后端使用

#### 标记公共接口
```go
type SomePublicReq struct {
    g.Meta `path:"/public/api" method:"get" tags:"公共" noAuth:"true"`
    // 请求参数
}
```

#### 获取认证信息
```go
func (c *Controller) SomePrivateAPI(ctx context.Context, req *SomePrivateReq) (res *SomePrivateRes, err error) {
    // 从上下文获取认证信息
    subject := gconv.String(g.RequestFromCtx(ctx).GetCtxVar("auth.subject"))
    iat := gconv.Int64(g.RequestFromCtx(ctx).GetCtxVar("auth.iat"))
    
    // 业务逻辑处理
    return
}
```

### 2. 前端使用

#### 登录
```typescript
const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'your-password' })
});

const data = await response.json();
if (data.token) {
    setToken(data.token, data.expiresAt);
    // 跳转到目标页面
}
```

#### 调用认证接口
```typescript
// 使用 alova 客户端，会自动添加 Authorization Header
const userInfo = await alovaInstance.Get('/api/auth/me');
```

#### 登出
```typescript
await fetch('/api/auth/logout', { method: 'POST' });
clearToken();
// 跳转到登录页
```

#### URL Token 登录
```typescript
// 1. 生成带 Token 的链接（后端或前端）
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const targetUrl = `https://example.com/admin/config/manage?token=${token}`;

// 2. 用户点击链接访问
// 前端自动检测 URL 中的 token 参数

// 3. 自动登录处理（在应用初始化时）
useEffect(() => {
    handleUrlToken(); // 检查并处理 URL Token
}, []);

// 4. 后续请求自动使用存储的 Token
// alova 拦截器会自动添加 Authorization Header
```

**URL Token 完整流程**：
1. **Token 生成**：通过正常登录接口获取 Token
2. **链接构造**：将 Token 作为 URL 参数附加到目标页面
3. **用户访问**：用户点击链接或直接访问带 Token 的 URL
4. **前端处理**：
   - 检测 URL 中的 `token` 参数
   - 验证 Token 格式（基础检查）
   - 存储 Token 到 localStorage 和 Cookie
   - 清除 URL 中的 token 参数（安全考虑）
   - 可选：调用 `/api/auth/me` 验证 Token 有效性
5. **后端验证**：
   - 中间件优先从 URL 参数提取 Token
   - 使用相同的 JWT 验证逻辑
   - 标记 Token 来源为 "url"
6. **后续请求**：使用存储的 Token 进行正常的 Header 认证

### 3. 路由守卫

#### 前端页面保护
```typescript
// 在受保护的页面组件中
useEffect(() => {
    const token = getToken();
    if (!token) {
        router.push('/login');
        return;
    }
    // 验证 Token 有效性
    checkTokenValidity();
}, []);
```

## 第三方组件

### 1. JWT 处理
- **库名称**：`github.com/golang-jwt/jwt/v5`
- **版本**：v5.x
- **用途**：JWT Token 的生成、解析和验证
- **选择原因**：Go 生态中最成熟的 JWT 库，支持多种签名算法

### 2. 前端 UI 组件
- **库名称**：`@arco-design/web-react`
- **用途**：登录表单、按钮、消息提示等 UI 组件
- **选择原因**：项目统一使用的 UI 组件库

### 3. HTTP 客户端
- **库名称**：`alova`
- **用途**：前端 HTTP 请求，支持请求拦截器
- **选择原因**：轻量级、支持 TypeScript、易于配置拦截器

### 4. 路由管理
- **库名称**：`next/navigation`
- **用途**：前端路由跳转、参数获取
- **选择原因**：Next.js 官方路由解决方案

## 安全考虑

### 1. Token 安全
- **HTTPS 强制**：生产环境必须使用 HTTPS 传输
- **密钥管理**：JWT 签名密钥仅存储在服务端配置中
- **最小权限**：Token 仅标识身份，不包含敏感业务信息

#### Token 验证时序安全
- **时钟同步**：服务器时间与标准时间同步，确保时间验证准确性
- **时间容差**：JWT 库内置时间容差机制，避免网络延迟导致的验证失败
- **签发时间验证**：`IssuedAt` 不能晚于当前时间，防止未来时间的恶意 Token
- **过期时间验证**：`ExpiresAt` 必须晚于当前时间，确保 Token 在有效期内
- **密码更新时序**：Token 签发时间必须晚于密码更新时间，实现统一失效

#### 验证优先级
```
1. 公共接口检查 (noAuth:"true") - 最高优先级，直接跳过
2. Token 提取 (URL > Header) - 支持多种传递方式
3. JWT 格式验证 - 基础格式检查
4. 签名验证 - 使用密钥验证完整性
5. 时间有效性验证 - JWT 标准时间检查
6. 密码更新失效验证 - 业务层面的统一失效
7. 上下文注入 - 验证成功后的信息传递
```

### 2. 密码安全
- **配置存储**：密码存储在动态配置中，支持运行时更新
- **失效机制**：密码修改后所有 Token 立即失效
- **未来改进**：建议改为哈希存储而非明文

### 3. 防护措施
- **登录限流**：防止暴力破解攻击（规划中）
- **错误处理**：统一错误响应，避免信息泄露
- **URL Token**：仅用于开发调试，生产环境建议关闭

## 测试策略

### 1. E2E 测试 (`front-web/tests/e2e/auth.spec.ts`)
- 登录成功流程验证
- Token 过期后重定向验证
- 受保护页面访问控制
- 公共接口无需认证验证

### 2. 单元测试（规划中）
- JWT 生成和验证逻辑
- 中间件认证逻辑
- Token 失效判断逻辑

### 3. 集成测试（规划中）
- 登录接口完整流程
- 认证中间件与控制器集成
- 配置更新后 Token 失效验证

## URL Token 实际使用示例

### 1. 邮件链接登录
```typescript
// 后端生成邮件链接
const generateEmailLink = async (targetPath: string) => {
    // 使用系统密码生成临时 Token（较短有效期）
    const token = await auth.GenerateToken(ctx, "admin", 300); // 5分钟有效期
    return `https://yourdomain.com${targetPath}?token=${token}`;
};

// 邮件内容
const emailContent = `
点击以下链接直接访问管理后台：
${generateEmailLink('/admin/config/manage')}
`;
```

### 2. 二维码登录
```typescript
// 生成二维码内容
const generateQRCode = async () => {
    const token = await auth.GenerateToken(ctx, "admin", 600); // 10分钟有效期
    const loginUrl = `https://yourdomain.com/dashboard?token=${token}`;
    return QRCode.toDataURL(loginUrl);
};
```

### 3. API 测试链接
```bash
# 直接在浏览器中测试 API
https://yourdomain.com/api/auth/me?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 或者使用 curl
curl "https://yourdomain.com/api/auth/me?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. 开发环境快速登录
```typescript
// 开发环境下的快速登录链接生成
if (process.env.NODE_ENV === 'development') {
    const devLoginLink = `http://localhost:3000/admin?token=${devToken}`;
    console.log('开发登录链接:', devLoginLink);
}
```

## 安全最佳实践

### URL Token 安全注意事项

1. **HTTPS 强制**：生产环境必须使用 HTTPS，防止 Token 在传输中泄露
2. **短期有效**：URL Token 建议设置较短的有效期（5-30分钟）
3. **一次性使用**：重要操作建议实现一次性 Token 机制
4. **日志清理**：定期清理包含 Token 的访问日志
5. **Referer 控制**：注意防止 Token 通过 Referer 头泄露到第三方网站

### 实现建议

```typescript
// 推荐的 URL Token 处理方式
class URLTokenHandler {
    // 检查并处理 URL Token
    static handleURLToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token && this.isValidJWTFormat(token)) {
            // 立即清除 URL 中的 token
            urlParams.delete('token');
            const cleanUrl = window.location.pathname + 
                (urlParams.toString() ? '?' + urlParams.toString() : '');
            window.history.replaceState({}, '', cleanUrl);
            
            // 存储 token
            setToken(token);
            
            // 验证 token 有效性
            this.validateToken(token);
        }
    }
    
    // JWT 格式验证
    static isValidJWTFormat(token: string): boolean {
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => part.length > 0);
    }
    
    // Token 验证
    static async validateToken(token: string) {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) {
                clearToken();
                window.location.href = '/login';
            }
        } catch (error) {
            clearToken();
            window.location.href = '/login';
        }
    }
}

// 在应用初始化时调用
URLTokenHandler.handleURLToken();
```

## 数据库设计模式

### 1. 认证数据存储模式

**配置表驱动认证**：鉴权模块不使用独立的用户表，而是基于动态配置系统（`dynamic_configs` 表）存储认证信息：

```sql
-- 认证相关配置存储在动态配置表中
-- 核心认证配置项：
{
  "core/dev/keyPassword": "管理员密码",
  "auth/dev/jwt_secret": "JWT签名密钥",
  "auth/dev/password_updated_at": "密码更新时间戳"
}
```

**配置命名空间设计**：
- `core/<env>/keyPassword` - 登录密码配置
- `auth/<env>/jwt_secret` - JWT签名密钥
- `auth/<env>/password_updated_at` - 密码更新时间（用于Token失效判断）

### 2. 无状态会话模式

**JWT Token设计**：
- 使用 HS256 对称加密算法
- 包含最小必要信息：`sub`(用户标识), `iat`(签发时间), `exp`(过期时间)
- 通过动态配置获取签名密钥，支持运行时更新

**时序安全验证**：
```
Token签发时间 >= 密码更新时间  => 验证通过
Token签发时间 < 密码更新时间   => 强制失效
```

### 3. 多端认证支持模式

**双重Token传递机制**：
- Header Bearer Token：标准API调用
- URL Token Parameter：静默登录、跨设备登录、开发调试

**Token提取优先级**：
1. URL参数 `?token=xxx`（最高优先级）
2. Authorization Header `Bearer xxx`（兜底机制）
3. 标记来源类型：`auth.via: "url" | "header"`

### 4. 预留设计模式

**多用户扩展预留**：
- JWT Claims 中的 `subject` 字段可扩展为用户ID
- 密码配置支持运行时更新，为未来用户管理系统预留接口

**权限系统预留**：
- 中间件支持 `noAuth:"true"` 标签，为RBAC权限系统预留
- 上下文注入机制，为权限验证预留数据接口

**会话管理预留**：
- Token 可包含会话标识信息
- 支持多设备同时在线，为设备管理预留

### 5. 安全设计模式

**统一失效机制**：
- 密码更新时更新 `password_updated_at` 时间戳
- 所有旧Token在下次验证时自动失效
- 无需维护黑名单或活跃会话列表

**配置热更新**：
- JWT密钥支持运行时动态更新
- 密码修改立即生效，无需重启服务
- 配置缓存机制确保性能

**时序安全保障**：
- 使用数据库时间戳确保一致性
- JWT标准时间验证 + 业务层失效验证
- 时钟同步容差处理

## 未来改进

### 1. 安全增强
- 密码哈希存储
- 登录限流和错误次数记录
- Token 刷新机制

### 2. 功能扩展
- 多用户支持（RBAC）
- 会话管理
- 审计日志

### 3. 性能优化
- Token 黑名单机制
- 缓存优化
- 并发性能提升

### 4. URL Token 增强
- 一次性 URL Token：实现用后即焚的 Token 机制
- Token 来源追踪：详细记录 Token 的使用来源和轨迹