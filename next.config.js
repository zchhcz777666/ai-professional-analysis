/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静态导出模式 — 生成纯静态 HTML/JS/CSS
  output: 'export',

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    unoptimized: true,
  },

  // 禁用不需要的优化以减小构建体积
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
