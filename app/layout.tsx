import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import B2BClientLogos from "@/components/B2BClientLogos";
import { CartProvider } from "@/lib/contexts/CartContext";
import { WishlistProvider } from "@/lib/contexts/WishlistContext";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { ThemeProvider } from "@/lib/contexts/ThemeContext";
import { ClientComponents } from "@/components/ClientComponents";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import MobileBottomNav from "@/components/MobileBottomNav";
import BackToTopButton from "@/components/BackToTopButton";
import SkipToContent from "@/components/SkipToContent";
import StructuredData from "@/components/StructuredData";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import SpeechReader from "@/components/SpeechReader";
import SentryInit from "@/components/SentryInit";
import ProductionSecurity from "@/components/ProductionSecurity";

// 字體優化（P1 BATCH10）：使用 font-display: swap 避免 FOIT
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap", // 避免 FOIT（Flash of Invisible Text）
  preload: true, // 預載入關鍵字體
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true, // 預載入關鍵字體
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  preload: false, // 非關鍵字體，不預載入
});

// 修復 ByteString 錯誤：簡化 metadata，避免中文字符編碼問題
export const metadata: Metadata = {
  title: {
    default: "ProWine | Premium Wine E-commerce",
    template: "%s | ProWine",
  },
  description: "Professional wine importer offering premium wines from world-class wineries. Discover exceptional wines from renowned wineries worldwide.",
  keywords: ["wine", "premium wine", "wine importer", "fine wine", "wine collection", "wine shop"],
  authors: [{ name: "ProWine" }],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "ProWine",
    title: "ProWine | Premium Wine E-commerce",
    description: "Professional wine importer offering premium wines from world-class wineries",
  },
  twitter: {
    card: "summary_large_image",
    title: "ProWine | Premium Wine E-commerce",
    description: "Professional wine importer offering premium wines from world-class wineries",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#722f37" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ProWine" />
        <link rel="apple-touch-icon" href="/fwdlogo/logo-large.png" />
        {/* View Transitions API 支持（P1 BATCH5） */}
        <meta name="view-transition" content="same-origin" />
        
        {/* 資源優先級優化（P1 BATCH11） */}
        {/* DNS 預解析 */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        
        {/* 預載入關鍵資源 */}
        <link rel="preload" href="/fwdlogo/logo-large.png" as="image" />
        {/* 預載入首屏 Hero 圖片 */}
        <link rel="preload" href="https://images.unsplash.com/photo-1506377247727-4b5c465f6e3a?w=1920&q=90" as="image" fetchPriority="high" />
        
        {/* 預載入關鍵字體 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SentryInit />
        <ProductionSecurity />
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <SkipToContent />
                    <StructuredData type="organization" />
                    <Header />
                    <main id="main-content" className="min-h-screen pt-24 pb-20 md:pb-0" style={{ position: 'relative', zIndex: 1 }}>{children}</main>
                    <B2BClientLogos />
                    <Footer />
                    <MobileBottomNav />
                    <BackToTopButton />
                    <SpeechReader />
                    <ClientComponents />
                    <ServiceWorkerRegistration />
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
