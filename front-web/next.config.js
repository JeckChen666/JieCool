/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    // 使用 beforeFiles，确保在 Next.js 处理内置 /api 路由或静态资源之前进行转发
    return {
      beforeFiles: [
        { source: "/file/:path*", destination: "http://localhost:8080/file/:path*" },
        // 后端未挂载 /api/v1 前缀的 file 路由，这里将前端的 /api/v1/file/* 转发到后端的 /file/*
        { source: "/api/v1/file/:path*", destination: "http://localhost:8080/file/:path*" },
        // 将前端的 /api/config/* 路由转发到后端的 /config/*（去掉api前缀）
        { source: "/api/config/:path*", destination: "http://localhost:8080/config/:path*" },
        // 将前端的 /api/daily/* 路由转发到后端的 /daily/*（去掉api前缀）
        { source: "/api/daily/:path*", destination: "http://localhost:8080/daily/:path*" },
        // 将前端的 /api/visit/* 路由转发到后端的 /visit/*（去掉api前缀）
        { source: "/api/visit/:path*", destination: "http://localhost:8080/visit/:path*" },
        // 将前端的 /api/weibo/* 路由转发到后端的 /weibo/*（去掉api前缀）
        { source: "/api/weibo/:path*", destination: "http://localhost:8080/weibo/:path*" },
        // 注意：/api/auth/* 不在这里重写，让它使用前端的API路由进行响应格式转换
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

module.exports = nextConfig;