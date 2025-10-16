package v1

import (
	"github.com/gogf/gf/v2/frame/g"
)

// CreateReq/Res 定义符合 gf gen ctrl 的约定（Operation+Req/Res）
type CreateReq struct {
	g.Meta `path:"/logs/visit" tags:"Visit" method:"post" summary:"Record a visit of home page" noAuth:"true"`
}

// CreateRes 为输出的响应结构，直接扁平化数据，不包含 status 字段
type CreateRes struct {
	Time      string            `json:"time"`      // RFC3339Nano 时间戳
	IP        string            `json:"ip"`        // 客户端IP
	UserAgent string            `json:"userAgent"` // UA
	Method    string            `json:"method"`    // 请求方法
	Path      string            `json:"path"`      // 请求路径
	Headers   map[string]string `json:"headers"`   // 请求头（首个值）
}
