import type { Metadata } from 'next'
import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

// 升級字體系統：使用Playfair Display等高級字體（Q12: B）
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: false, // 非主要字體，延遲載入
})

export const metadata: Metadata = {
  title: 'ProWine 酩陽實業 - 精品葡萄酒進口商',
  description: '台灣頂級葡萄酒進口商，專注法國優質產區，提供專業選酒服務',
  keywords: '葡萄酒, 紅酒, 白酒, 法國葡萄酒, 進口酒, 勃艮地, 隆河',
  manifest: '/manifest.json',
  themeColor: '#1A1A1A',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    title: 'ProWine 酩陽實業',
    description: '台灣頂級葡萄酒進口商',
    type: 'website',
    locale: 'zh_TW',
  },
  // 性能優化
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // SEO優化
  alternates: {
    canonical: 'https://prowine.com.tw',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1A1A1A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 添加版本號和構建時間戳（避免舊版本問題）
  const buildTime = process.env.BUILD_TIME || Date.now().toString()
  
  return (
    <html lang="zh-TW" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <head>
        <meta name="version" content={buildTime} />
        <meta name="build-time" content={new Date(parseInt(buildTime)).toISOString()} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  )
}
