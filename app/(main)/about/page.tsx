import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Award, Truck, Users, Handshake } from 'lucide-react'

// 強制動態渲染
export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const supabase = await createClient()

  return (
    <div className="container mx-auto px-4 py-16 md:py-32 max-w-7xl">
      {/* Hero Section */}
      <section className="text-center mb-24 md:mb-32">
        <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-dark mb-6 md:mb-8">
          葡萄酒的園丁，風土的說書人
        </h1>
        <p className="font-serif text-lg md:text-xl text-secondary-grey-600 max-w-3xl mx-auto leading-relaxed">
          二十年前，我們帶著對葡萄酒的熱愛，開始了這段旅程。
        </p>
      </section>

      {/* 品牌故事 */}
      <section className="mb-24 md:mb-32">
        <div className="prose prose-lg max-w-none">
          <p className="font-serif text-base md:text-lg text-secondary-grey-600 leading-relaxed mb-6">
            不是為了追逐流行，而是為了尋找那些真正動人的故事——
            埋藏在每一瓶酒裡的，關於土地、陽光、時間，還有人的故事。
          </p>
          <p className="font-serif text-base md:text-lg text-secondary-grey-600 leading-relaxed mb-6">
            我們走訪法國的大小產區，從南隆河的陽光普照，到勃艮地的細膩優雅；
            從香檳區的璀璨氣泡，到波爾多的莊嚴經典。
            每一次拜訪，都是一次對風土的朝聖。
          </p>
          <p className="font-serif text-base md:text-lg text-secondary-grey-600 leading-relaxed mb-6">
            我們不盲目追求高分，因為我們知道，
            最適合的酒，往往不是最貴的那瓶，
            而是最懂你此刻心情的那一支。
          </p>
          <p className="font-serif text-base md:text-lg text-secondary-grey-600 leading-relaxed">
            ProWine，不只是進口商，
            我們是葡萄酒的園丁，細心挑選每一株值得珍藏的佳釀；
            我們是風土的說書人，為每瓶酒找到最對的人。
          </p>
        </div>
      </section>

      {/* 我們的堅持 */}
      <section className="mb-24 md:mb-32">
        <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-dark mb-12 md:mb-16 text-center">
          我們的堅持
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* 選酒標準 */}
          <div className="bg-white p-8 border border-secondary-grey-200">
            <div className="flex items-center mb-4">
              <Award className="w-8 h-8 text-primary-gold mr-4" />
              <h3 className="font-serif text-2xl font-semibold text-primary-dark">
                選酒標準
              </h3>
            </div>
            <p className="font-sans text-base text-secondary-grey-600 leading-relaxed">
              不妥協於市場趨勢，只選擇真正打動我們的酒款。
              每一瓶酒都經過專業團隊親自品飲，確認品質穩定。
            </p>
          </div>

          {/* 冷鏈物流 */}
          <div className="bg-white p-8 border border-secondary-grey-200">
            <div className="flex items-center mb-4">
              <Truck className="w-8 h-8 text-primary-gold mr-4" />
              <h3 className="font-serif text-2xl font-semibold text-primary-dark">
                冷鏈物流
              </h3>
            </div>
            <p className="font-sans text-base text-secondary-grey-600 leading-relaxed">
              從酒莊到您的酒櫃，全程溫控運輸。
              因為我們知道，好酒需要被溫柔對待。
            </p>
          </div>

          {/* 專業服務 */}
          <div className="bg-white p-8 border border-secondary-grey-200">
            <div className="flex items-center mb-4">
              <Users className="w-8 h-8 text-primary-gold mr-4" />
              <h3 className="font-serif text-2xl font-semibold text-primary-dark">
                專業服務
              </h3>
            </div>
            <p className="font-sans text-base text-secondary-grey-600 leading-relaxed">
              20年經驗累積的專業知識，
              不是用來炫耀，而是用來服務。
              無論企業採購或個人品飲，
              我們都提供最貼心的選酒建議。
            </p>
          </div>

          {/* 直接合作 */}
          <div className="bg-white p-8 border border-secondary-grey-200">
            <div className="flex items-center mb-4">
              <Handshake className="w-8 h-8 text-primary-gold mr-4" />
              <h3 className="font-serif text-2xl font-semibold text-primary-dark">
                直接合作
              </h3>
            </div>
            <p className="font-sans text-base text-secondary-grey-600 leading-relaxed">
              我們相信，最短的距離帶來最真實的故事。
              直接與酒莊合作，讓您品嚐到最純粹的風土表現。
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 md:py-24 bg-primary-cream">
        <p className="font-serif text-xl md:text-2xl text-primary-dark mb-6 md:mb-8">
          從一杯酒開始，探索世界的美好。
        </p>
        <p className="font-display text-2xl md:text-3xl font-bold text-primary-dark mb-8 md:mb-12">
          ProWine，您的葡萄酒顧問
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button variant="default" size="lg" href="/wines" className="touch-target">
            探索酒款
          </Button>
          <Button variant="outline" size="lg" href="/contact" className="touch-target">
            聯繫我們
          </Button>
        </div>
        <p className="font-sans text-sm md:text-base text-secondary-grey-600 mt-8">
          LINE@ 諮詢：@415znht
        </p>
      </section>
    </div>
  )
}

