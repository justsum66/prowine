import { Header } from '@/components/layouts/Header'
import { Footer } from '@/components/layouts/Footer'
import { MobileNav } from '@/components/layouts/MobileNav'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import dynamic from 'next/dynamic'

// 動態導入 AISommelierChat，如果出錯不會影響整個頁面
const AISommelierChat = dynamic(
  () => import('@/components/ai/AISommelierChat').then(mod => ({ default: mod.AISommelierChat })),
  { 
    ssr: false,
    loading: () => null, // 不顯示載入狀態，避免影響頁面
  }
)

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ErrorBoundary fallback={null}>
        <Header />
      </ErrorBoundary>
      <main className="min-h-screen pb-16 md:pb-0">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
      <ErrorBoundary fallback={null}>
        <Footer />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <MobileNav />
      </ErrorBoundary>
      <ErrorBoundary fallback={null}>
        <AISommelierChat />
      </ErrorBoundary>
    </>
  )
}
