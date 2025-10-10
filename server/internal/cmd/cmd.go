package cmd

import (
    "context"

    "github.com/gogf/gf/v2/frame/g"
    "github.com/gogf/gf/v2/net/ghttp"
    "github.com/gogf/gf/v2/os/gcmd"

    "server/internal/controller/config"
    "server/internal/controller/daily"
    "server/internal/controller/file"
    "server/internal/controller/hello"
    "server/internal/controller/visit"
    "server/internal/service/configcache"
)

var (
	Main = gcmd.Command{
		Name:  "main",
		Usage: "main",
        Brief: "start http server",
        Func: func(ctx context.Context, parser *gcmd.Parser) (err error) {
            s := g.Server()
            // 启动前预加载动态配置缓存
            if _, err := configcache.PreloadAll(ctx); err != nil {
                g.Log().Warning(ctx, "ConfigCache preload failed, continue to start server:", err)
            }
            s.Group("/", func(group *ghttp.RouterGroup) {
                group.Middleware(ghttp.MiddlewareHandlerResponse)
                group.Middleware(ghttp.MiddlewareCORS)
                group.Bind(
                    config.NewV1(),
                    hello.NewV1(),
                    visit.NewV1(),
                    daily.NewV1(),
                    file.NewV1(),
                )
            })
			s.SetPort(8080)
			s.Run()
			return nil
		},
	}
)
