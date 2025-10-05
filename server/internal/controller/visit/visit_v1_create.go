package visit

import (
	"context"
	"time"

	"github.com/gogf/gf/v2/errors/gcode"
	"github.com/gogf/gf/v2/errors/gerror"
	"github.com/gogf/gf/v2/frame/g"

	"server/api/visit/v1"
	"server/internal/service"
)

func (c *ControllerV1) Create(ctx context.Context, req *v1.CreateReq) (res *v1.CreateRes, err error) {
	// 从上下文中获取请求对象
	r := g.RequestFromCtx(ctx)
	if r == nil {
		return nil, gerror.NewCode(gcode.CodeInternalError)
	}

	// 尝试获取客户端 IP（优先使用框架提供的方法）
	ip := ""
	// GetRemoteIp 在 GoFrame 中用于获取真实远端IP，避免被 Header 伪造
	// 如果方法不可用，降级为空字符串
	if getIpFunc := r.GetRemoteIp; getIpFunc != nil {
		ip = r.GetRemoteIp()
	}

	// 收集请求头信息（扁平化为 map[string]string）
	headers := make(map[string]string)
	for k, v := range r.Header {
		if len(v) > 0 {
			headers[k] = v[0]
		} else {
			headers[k] = ""
		}
	}

	ua := r.Header.Get("User-Agent")

	// 组装访问信息
	info := service.VisitAccessInfo{
		TimeRFC3339: time.Now().Format(time.RFC3339Nano),
		IP:          ip,
		UserAgent:   ua,
		Headers:     headers,
		Method:      r.Method,
		Path:        r.URL.Path,
	}

	// 保存访问信息
	if err := service.SaveAccess(ctx, &info); err != nil {
		return nil, gerror.WrapCode(gcode.CodeInternalError, err, "保存访问信息失败")
	}

	// 通过返回值返回数据（扁平结构，不包含 status）
	return &v1.CreateRes{
		Time:      info.TimeRFC3339,
		IP:        info.IP,
		UserAgent: info.UserAgent,
		Method:    info.Method,
		Path:      info.Path,
		Headers:   info.Headers,
	}, nil
}
