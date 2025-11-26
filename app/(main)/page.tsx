import { createClient } from '@/lib/supabase/server'
import { WineCard } from '@/components/cards/WineCard'
import { WineryCard } from '@/components/cards/WineryCard'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // 獲取精選酒款（錯誤處理）
  let featuredWines = null
  let winesError = false
  
  // 獲取精選酒莊（錯誤處理）
  let featuredWineries = null
  let wineriesError = false

  try {
    const supabase = await createClient()
    
    // 獲取精選酒款
    try {
      const { data, error } = await supabase
        .from('wines')
        .select('*, wineries(*)')
        .eq('is_featured', true)
        .eq('is_available', true)
        .limit(8)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching featured wines:', error)
        winesError = true
      } else {
        // 將 wineries 陣列轉換為單一 winery 物件
        featuredWines = data?.map((wine: any) => ({
          ...wine,
          winery: Array.isArray(wine.wineries) && wine.wineries.length > 0 
            ? wine.wineries[0] 
            : null
        })) || null
      }
    } catch (error) {
      console.error('Error fetching featured wines:', error)
      winesError = true
    }

    // 獲取精選酒莊
    try {
      const { data, error } = await supabase
        .from('wineries')
        .select('*')
        .order('awards_count', { ascending: false })
        .limit(6)
      
      if (error) {
        console.error('Error fetching featured wineries:', error)
        wineriesError = true
      } else {
        featuredWineries = data
      }
    } catch (error) {
      console.error('Error fetching featured wineries:', error)
      wineriesError = true
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error)
    winesError = true
    wineriesError = true
  }

  // 確保即使有錯誤也顯示頁面內容
  return (
    <>
      {/* Hero Section - 升級版：全屏設計、精緻品牌宣言、流暢動畫、更好視覺層次 */}
      <section className="relative h-screen flex items-center justify-center bg-primary-cream overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-[20s] ease-out"
          style={{
            backgroundImage: "url('/hero-wine.jpg')",
          }}
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          {/* 單一品牌宣言 - Playfair Display, 大尺寸, 極簡, 流暢動畫（Q12: B） */}
          <h1
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 leading-tight"
            style={{
              fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
              letterSpacing: '-0.02em',
            }}
          >
            從風土到餐桌
          </h1>
          <p
            className="font-serif text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 md:mb-12"
            style={{
              fontFamily: 'var(--font-playfair), var(--font-cormorant), serif',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            我們守護每一個美好時刻
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button
              variant="default"
              size="lg"
              href="/wines"
              className="w-full md:w-auto touch-target hover:bg-primary-gold transition-all duration-300"
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              探索酒款
            </Button>
            <Button
              variant="outline"
              size="lg"
              href="/contact"
              className="w-full md:w-auto bg-white/10 border-white text-white hover:bg-white hover:text-primary-dark touch-target transition-all duration-300"
              style={{
                backdropFilter: 'blur(10px)',
              }}
            >
              聯繫顧問
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Wines - 按照規範: 120px區塊間距 */}
      <section className="py-32 bg-white" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-dark mb-4">
              精選酒款
            </h2>
            <p className="font-sans text-base md:text-lg text-secondary-grey-600">
              專業團隊精心挑選的優質葡萄酒
            </p>
          </div>
          {winesError ? (
            <div className="text-center py-16">
              <p className="font-sans text-lg text-secondary-grey-600 mb-4">
                資料載入錯誤，請稍後再試
              </p>
              <Button variant="outline" size="lg" href="/wines" className="touch-target">
                瀏覽所有酒款
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          ) : featuredWines && featuredWines.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 mb-8 md:mb-12">
                {featuredWines.map((wine) => (
                  <WineCard key={wine.id} wine={wine} />
                ))}
              </div>
              <div className="text-center">
                <Button variant="outline" size="lg" href="/wines" className="touch-target">
                  查看所有酒款
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="font-sans text-lg text-secondary-grey-600 mb-4">
                目前沒有精選酒款
              </p>
              <Button variant="outline" size="lg" href="/wines" className="touch-target">
                瀏覽所有酒款
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Wineries - 按照規範: 120px區塊間距 */}
      <section className="py-32 bg-primary-cream" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-24">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-dark mb-4">
              精選酒莊
            </h2>
            <p className="font-sans text-base md:text-lg text-secondary-grey-600">
              來自法國優質產區的傳奇酒莊
            </p>
          </div>
          {wineriesError ? (
            <div className="text-center py-16">
              <p className="font-sans text-lg text-secondary-grey-600 mb-4">
                資料載入錯誤，請稍後再試
              </p>
              <Button variant="outline" size="lg" href="/wineries" className="touch-target">
                瀏覽所有酒莊
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          ) : featuredWineries && featuredWineries.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {featuredWineries.map((winery, index) => (
                <WineryCard
                  key={winery.id}
                  winery={winery}
                  featured={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="font-sans text-lg text-secondary-grey-600 mb-4">
                目前沒有精選酒莊
              </p>
              <Button variant="outline" size="lg" href="/wineries" className="touch-target">
                瀏覽所有酒莊
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* About Section - 按照規範: 120px區塊間距 */}
      <section className="py-32 bg-white" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-dark mb-4 md:mb-6">
                關於 ProWine
              </h2>
              <p className="font-serif text-base md:text-lg text-secondary-grey-600 leading-relaxed mb-4 md:mb-6">
                二十年前，我們帶著對葡萄酒的熱愛，開始了這段旅程。
                不是為了追逐流行，而是為了尋找那些真正動人的故事——
                埋藏在每一瓶酒裡的，關於土地、陽光、時間，還有人的故事。
              </p>
              <p className="font-serif text-base md:text-lg text-secondary-grey-600 leading-relaxed mb-6 md:mb-8">
                我們走訪法國的大小產區，從南隆河的陽光普照，到勃艮地的細膩優雅；
                從香檳區的璀璨氣泡，到波爾多的莊嚴經典。
                每一次拜訪，都是一次對風土的朝聖。
              </p>
              <Button variant="default" size="lg" href="/contact" className="touch-target">
                了解更多
              </Button>
            </div>
            <div className="relative aspect-square bg-primary-cream hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-burgundy/20 to-primary-gold/20" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-32 bg-primary-dark text-white">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 md:mb-6">
            準備好探索葡萄酒的世界了嗎？
          </h2>
          <p className="font-sans text-base md:text-lg text-secondary-grey-400 mb-6 md:mb-8 max-w-2xl mx-auto">
            加入我們的社群，獲得第一手特惠活動和專業選酒建議
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              variant="gold"
              size="lg"
              href={`https://line.me/R/ti/p/${process.env.NEXT_PUBLIC_LINE_ID?.replace('@', '')}`}
              className="touch-target"
            >
              加入 LINE@
            </Button>
            <Button
              variant="outline"
              size="lg"
              href={`https://www.facebook.com/profile.php?id=${process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID}`}
              className="border-white text-white hover:bg-white hover:text-primary-dark touch-target"
            >
              Facebook 粉絲團
            </Button>
            <Button
              variant="outline"
              size="lg"
              href={`https://www.instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE}`}
              className="border-white text-white hover:bg-white hover:text-primary-dark touch-target"
            >
              Instagram
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
