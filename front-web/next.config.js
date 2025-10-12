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
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

module.exports = nextConfig;