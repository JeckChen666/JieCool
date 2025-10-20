package middleware

import (
	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gtime"
)

// AccessLog 访问日志
// AccessLog 是一个中间件函数，用于记录访问日志
// 它接收一个 *ghttp.Request 对象作为参数，该对象包含了请求的相关信息
// 这个函数没有返回值
// 它的主要职责是记录每次HTTP请求的详细信息，以便于后续的日志分析和审计
func AccessLog(r *ghttp.Request) {
	// 获取会话对象和会话ID
	session := r.Session
	id := r.GetSessionId()
	if id == "" {
		_ = session.Set("FirstAccessTime", gtime.Now())
	}
	// 控制台打印
	// 在控制台中输出请求的信息，包括URL、请求方法、客户端IP、用户代理和会话ID
	// 这些信息对于监控和调试HTTP请求非常有用
	g.Log().Info(r.Context(), "请求信息", g.Map{
		"url":        r.URL.String(),
		"method":     r.Method,
		"ip":         r.GetClientIp(),
		"user_agent": r.UserAgent(),
		"session_id": r.GetSessionId(),
	})

	// 继续执行下一个中间件或最终的处理器函数
	// 这行代码确保了请求处理链的继续执行，不会因为日志记录而中断正常的请求处理流程
	r.Middleware.Next()
}
