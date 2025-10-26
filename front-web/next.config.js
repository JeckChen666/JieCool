/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  async rewrites() {
    // 使用 beforeFiles，确保在 Next.js 处理内置 /api 路由或静态资源之前进行转发
    return {
      beforeFiles: [
        // 注意：所有API路由现在直接通过alova访问后端，不再需要Next.js重写规则
        // 保留以下规则用于非API资源的重写（如果有需要的话）
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

module.exports = nextConfig;