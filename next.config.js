/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    unoptimized: false,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // 确保拆分后的省份数据文件被部署到 serverless 函数
    outputFileTracingIncludes: {
      '/api/*': ['./public/data/scores/**/*.json']
    },
  },
}

module.exports = nextConfig
