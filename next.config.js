/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'prowine.com.tw',
      },
      {
        protocol: 'https',
        hostname: 'ohchipfmenenezlnnrjv.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    // 性能優化
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  // 性能優化
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  // 優化構建
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 強制刷新機制（避免舊版本問題）
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
            {
              key: 'X-Build-Version',
              value: process.env.BUILD_TIME || Date.now().toString(),
            },
          ],
        },
      ]
    }
    return []
  },
  // 環境變數：構建時間戳
  env: {
    BUILD_TIME: Date.now().toString(),
  },
  // PWA配置
  // 注意：next-pwa需要在生產環境才生效
}

module.exports = nextConfig
