// Package middleware 提供HTTP中间件功能
//
// 本包实现了JWT身份验证中间件，支持以下特性：
// - 基于GoFrame的g.Meta标签进行路由级别的鉴权控制
// - 支持多种Token传递方式：URL参数、Authorization头部
// - 自动解析JWT Claims并注入请求上下文
// - 提供灵活的公开接口配置机制
//
// 使用示例：
//
//	// 在路由中使用中间件
//	group.Middleware(middleware.MiddlewareJWT)
//
//	// 标记公开接口（无需鉴权）
//	func (c *Controller) PublicAPI(ctx context.Context, req *v1.PublicReq) (res *v1.PublicRes, err error) {
//	    // g.Meta{noAuth:"true"}
//	}
package middleware

import (
	"github.com/gogf/gf/v2/frame/g"
	"strings"

	"github.com/gogf/gf/v2/net/ghttp"

	"server/internal/service/auth"
)

// getMetaTag 安全读取当前路由处理函数的g.Meta标签值
//
// 该函数用于从GoFrame的路由处理器中提取元数据标签，主要用于判断接口的鉴权配置。
// 通过读取控制器方法上的g.Meta标签，可以实现细粒度的权限控制。
//
// 参数：
//   - r: GoFrame HTTP请求对象，包含当前请求的所有信息
//   - key: 要读取的元数据标签键名，如"noAuth"、"roles"等
//
// 返回值：
//   - string: 标签对应的值，如果标签不存在或处理器为空则返回空字符串
//
// 使用场景：
//   - 判断接口是否需要鉴权（noAuth标签）
//   - 读取接口所需的角色权限（roles标签）
//   - 获取其他自定义的路由级别配置
//
// 安全性：
//   - 函数会检查处理器是否为空，避免空指针异常
//   - 使用GoFrame官方提供的GetMetaTag方法，确保读取的安全性
func getMetaTag(r *ghttp.Request, key string) string {
	// 获取当前请求的路由处理器信息
	hi := r.GetServeHandler()
	if hi == nil {
		// 如果处理器为空（异常情况），返回空字符串
		return ""
	}
	// 使用GoFrame提供的HandlerItem.GetMetaTag方法安全读取标签
	return hi.GetMetaTag(key)
}

// MiddlewareJWT JWT身份验证中间件
//
// 这是一个基于JWT的身份验证中间件，提供灵活的鉴权机制。支持通过g.Meta标签
// 配置公开接口，同时支持多种Token传递方式，确保API的安全性和易用性。
//
// 鉴权流程：
//  1. 检查路由是否标记为公开接口（noAuth:"true"）
//  2. 从URL参数或Authorization头部提取JWT Token
//  3. 验证Token的有效性和完整性
//  4. 解析JWT Claims并注入请求上下文
//  5. 继续执行后续中间件和控制器
//
// Token获取优先级：
//  1. URL查询参数 ?token=xxx（用于静默登录、调试等场景）
//  2. Authorization头部 "Bearer <token>"（标准HTTP鉴权方式）
//
// 上下文注入的变量：
//   - auth.subject: JWT的Subject字段，通常为用户ID
//   - auth.iat: Token签发时间（Unix时间戳）
//   - auth.exp: Token过期时间（Unix时间戳）
//   - auth.via: Token来源标识（"url"或"header"）
//
// 参数：
//   - r: GoFrame HTTP请求对象
//
// 响应状态码：
//   - 401: Token缺失、无效或已过期
//   - 继续执行: Token验证成功，继续后续处理
//
// 使用示例：
//
//	// 1. 在路由组中应用中间件
//	apiGroup := s.Group("/api")
//	apiGroup.Middleware(middleware.MiddlewareJWT)
//
//	// 2. 标记公开接口
//	func (c *Controller) Login(ctx context.Context, req *v1.LoginReq) (res *v1.LoginRes, err error) {
//	    // g.Meta{noAuth:"true"}  // 登录接口无需鉴权
//	}
//
//	// 3. 在控制器中读取用户信息
//	func (c *Controller) GetProfile(ctx context.Context, req *v1.ProfileReq) (res *v1.ProfileRes, err error) {
//	    userID := gconv.String(g.RequestFromCtx(ctx).GetCtxVar("auth.subject"))
//	    tokenSource := gconv.String(g.RequestFromCtx(ctx).GetCtxVar("auth.via"))
//	}
//
// 安全注意事项：
//   - URL Token仅建议用于开发调试，生产环境应优先使用Authorization头部
//   - Token在URL中可能被日志记录，存在安全风险
//   - 建议为URL Token设置较短的过期时间
func MiddlewareJWT(r *ghttp.Request) {
	// 第一步：检查是否为公开接口
	// 通过读取控制器方法的g.Meta标签判断是否需要鉴权
	// 如果标记了noAuth:"true"，则跳过所有鉴权逻辑
	if strings.EqualFold(getMetaTag(r, "noAuth"), "true") {
		r.Middleware.Next()
		return
	}

	// 第二步：提取JWT Token
	// 优先从URL查询参数中获取token（用于静默登录、调试等场景）
	token := r.GetQuery("token").String()

	// 如果URL中没有token，则尝试从Authorization头部获取
	if token == "" {
		authz := r.Header.Get("Authorization")
		// 检查是否为标准的Bearer Token格式
		if strings.HasPrefix(strings.ToLower(authz), "bearer ") {
			// 提取Bearer后面的token部分，并去除首尾空格
			token = strings.TrimSpace(authz[7:])
		}
	}

	// 如果两种方式都没有获取到token，返回401未授权
	if token == "" {
		r.Response.WriteStatusExit(401)
		return
	}

	// 第三步：验证JWT Token
	// 调用auth服务验证token的有效性、完整性和过期时间
	claims, err := auth.ValidateToken(r.GetCtx(), token)
	if err != nil || claims == nil {
		g.Log().Info(r.GetCtx(), "Token验证失败: ", token+"; err: ", err, ";")
		// Token无效、已过期或验证失败，返回401未授权
		r.Response.WriteStatusExit(401)
		return
	}

	// 第四步：注入用户信息到请求上下文
	// 将JWT Claims中的关键信息注入到请求上下文，便于后续控制器使用

	// 注入用户标识（通常为用户ID）
	r.SetCtxVar("auth.subject", claims.Subject)

	// 注入Token时间信息
	iat := int64(0) // 签发时间（Issued At）
	exp := int64(0) // 过期时间（Expires At）

	// 安全地提取时间戳，避免空指针异常
	if claims.IssuedAt != nil {
		iat = claims.IssuedAt.Unix()
	}
	if claims.ExpiresAt != nil {
		exp = claims.ExpiresAt.Unix()
	}

	r.SetCtxVar("auth.iat", iat)
	r.SetCtxVar("auth.exp", exp)

	// 标记Token来源，便于后续逻辑区分处理
	// 这对于安全审计和调试非常有用
	if r.GetQuery("token").String() != "" {
		r.SetCtxVar("auth.via", "url") // Token来自URL参数
	} else {
		r.SetCtxVar("auth.via", "header") // Token来自Authorization头部
	}

	// 第五步：继续执行后续中间件和控制器
	// 鉴权成功，允许请求继续处理
	r.Middleware.Next()
}
