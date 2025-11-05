package cmd

import (
	"context"

	"github.com/gogf/gf/v2/frame/g"
	"github.com/gogf/gf/v2/net/ghttp"
	"github.com/gogf/gf/v2/os/gcmd"

	"server/internal/controller/auth"
	"server/internal/controller/blog"
	"server/internal/controller/config"
	"server/internal/controller/daily"
	"server/internal/controller/file"
	"server/internal/controller/hello"
	"server/internal/controller/visit"
	"server/internal/controller/weibo"
	"server/internal/middleware"
	"server/internal/service"
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
			// 启动文件清理调度器
			service.StartCleanupScheduler(ctx)
			g.Log().Info(ctx, "文件清理调度器已启动")
			swaggerEnabled, swaggerErr := g.Cfg().Get(ctx, "swagger.enabled")
			if swaggerErr == nil && !swaggerEnabled.Bool() {
				swaggerPath, _ := g.Cfg().Get(ctx, "swagger.swaggerPath")
				openapiPath, _ := g.Cfg().Get(ctx, "swagger.openapiPath")
				s.SetSwaggerPath(swaggerPath.String())
				s.SetOpenApiPath(openapiPath.String())
			}
			s.Use(ghttp.MiddlewareCORS)
			s.Group("/", func(group *ghttp.RouterGroup) {
				group.Hook(s.GetOpenApiPath(), ghttp.HookBeforeServe, openApiBasicAuth)
				//group.Middleware(ghttp.MiddlewareCORS)
				group.Middleware(ghttp.MiddlewareHandlerResponse)
				group.Middleware(middleware.AccessLog)
				group.Middleware(middleware.MiddlewareJWT)
				group.Bind(
					auth.NewV1(),
					blog.NewV1(),
					config.NewV1(),
					hello.NewV1(),
					visit.NewV1(),
					daily.NewV1(),
					file.NewV1(),
					weibo.NewV1(),
				)
			})
			s.Run()
			return nil
		},
	}
)

func openApiBasicAuth(r *ghttp.Request) {
	enabled, err := g.Cfg().Get(r.GetCtx(), "swagger.auth.enabled")
	if err != nil || !enabled.Bool() {
		return
	}
	username, _ := g.Cfg().Get(r.GetCtx(), "swagger.auth.username")
	password, _ := g.Cfg().Get(r.GetCtx(), "swagger.auth.password")
	if !r.BasicAuth(username.String(), password.String(), "Restricted") {
		r.ExitAll()
		return
	}
}
