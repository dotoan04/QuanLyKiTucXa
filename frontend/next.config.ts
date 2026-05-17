import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  ...(process.env.NODE_ENV === 'development' ? {
    turbopack: {
      root: 'E:/AI_Tools/QuanLyKiTucXa/frontend'
    }
  } : {})
}

export default nextConfig
