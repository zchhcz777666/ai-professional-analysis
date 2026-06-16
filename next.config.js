/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel 部署优化
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  // 如果部署后图片加载有问题，在这里配置域名
  images: {
    unoptimized: false,
  },

  // API 路由配置
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
