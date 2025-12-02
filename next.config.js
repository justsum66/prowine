/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "prowine.com.tw",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.darioush.com",
      },
      {
        protocol: "https",
        hostname: "www.staglinfamily.com",
      },
      {
        protocol: "https",
        hostname: "www.chateau-margaux.com",
      },
      {
        protocol: "https",
        hostname: "www.vega-sicilia.com",
      },
      {
        protocol: "https",
        hostname: "**.wine-searcher.com",
      },
      {
        protocol: "https",
        hostname: "**.vivino.com",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.s3.*.amazonaws.com",
      },
      // 酒莊LOGO域名
      {
        protocol: "https",
        hostname: "images.squarespace-cdn.com",
      },
      {
        protocol: "https",
        hostname: "www.brcohn.com",
      },
      {
        protocol: "https",
        hostname: "www.camomiwinery.com",
      },
      {
        protocol: "https",
        hostname: "cartlidgeandbrowne.com",
      },
      {
        protocol: "https",
        hostname: "www.chateau-trinquevedel.fr",
      },
      {
        protocol: "https",
        hostname: "www.cosentinowinery.com",
      },
      {
        protocol: "https",
        hostname: "cgdiarie.com",
      },
      {
        protocol: "https",
        hostname: "www.champagne-dissaux-brochot.com",
      },
      {
        protocol: "https",
        hostname: "www.domaine-la-bastidonne.com",
      },
      {
        protocol: "https",
        hostname: "www.domaine-escaravailles.com",
      },
      {
        protocol: "https",
        hostname: "www.monardiere.com",
      },
      {
        protocol: "https",
        hostname: "grgich.com",
      },
      {
        protocol: "https",
        hostname: "kanpai.wine",
      },
      {
        protocol: "https",
        hostname: "bastide-st-dominique.com",
      },
      {
        protocol: "https",
        hostname: "peterfranus.com",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "silverghost.wpengine.com",
      },
      {
        protocol: "https",
        hostname: "somerstonwineco.com",
      },
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
      {
        protocol: "https",
        hostname: "www.swansonvineyards.com",
      },
      // 通用域名模式（支持所有酒莊官網）
      {
        protocol: "https",
        hostname: "**.com",
      },
      {
        protocol: "https",
        hostname: "**.fr",
      },
      {
        protocol: "https",
        hostname: "**.es",
      },
      {
        protocol: "https",
        hostname: "**.wine",
      },
    ],
    unoptimized: process.env.NODE_ENV === "development",
    formats: ['image/avif', 'image/webp'], // 圖片優化策略（P1 BATCH10）
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"], // 代碼分割優化（P1 BATCH10）
  },
  // Turbopack 配置（Next.js 16 兼容）
  // 注意：Turbopack 的 resolveAlias 不支持 false 值，必須是字符串路徑
  // 使用存根模塊來避免構建時解析錯誤
  turbopack: {
    resolveAlias: {
      'web-push': './lib/services/web-push-stub.ts',
    },
  },
  // 代碼分割優化（P1 BATCH10）：分離第三方庫到獨立 chunk
  // 注意：Next.js 16 默認使用 Turbopack，webpack 配置僅作為備用
  webpack: (config, { isServer, dev, webpack }) => {
    // 生產環境完全禁用 source maps（防止代碼洩露）
    if (!dev && !isServer) {
      config.devtool = false;
    }
    
    // 忽略 web-push 模塊（可選依賴，避免構建時錯誤）
    config.resolve.alias = {
      ...config.resolve.alias,
      "web-push": false,
    };
    
    // 使用 webpack.IgnorePlugin 完全忽略 web-push
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^web-push$/,
      })
    );
    
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 分離第三方庫
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 20,
            },
            lucideReact: {
              name: 'lucide-react',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 20,
            },
            // 其他第三方庫
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
            },
          },
        },
      };
    }
    return config;
  },
  reactStrictMode: false,
  // 修復 ByteString 錯誤：確保正確處理中文字符
  poweredByHeader: false,
  compress: true,
  // Sentry 配置已移至 sentry.*.config.ts 文件
  // Next.js 16 不再支持 next.config.js 中的 sentry 配置
  // 優化性能
  // 禁用source map（修復INVALID SOURCE MAP錯誤 + 防止代碼洩露）
  productionBrowserSourceMaps: false,
  // 優化內存使用（減少頁面緩存）
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2, // 只緩存 2 個頁面
  },
  // 修復 Cross origin request 警告
  allowedDevOrigins: ['192.168.68.51'],
  // 緩存策略（P1 BATCH11）：生產環境優化緩存
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
          ],
        },
      ];
    }
    
    // 生產環境緩存策略
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

