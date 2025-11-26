import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { WineCard } from '@/components/cards/WineCard'
import { InquiryForm } from '@/components/inquiry/InquiryForm'
import { MobileInquiryButton } from '@/components/ui/MobileInquiryButton'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function WineDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: wineData, error } = await supabase
    .from('wines')
    .select('*, wineries(*)')
    .eq('slug', slug)
    .single()

  if (error || !wineData) {
    notFound()
  }

  // 將 wineries 陣列轉換為單一 winery 物件
  const wine = {
    ...wineData,
    winery: Array.isArray(wineData.wineries) && wineData.wineries.length > 0 
      ? wineData.wineries[0] 
      : null
  }

  // 獲取相關酒款
  const { data: relatedWinesData } = await supabase
    .from('wines')
    .select('*, wineries(*)')
    .eq('winery_id', wine.winery_id)
    .neq('id', wine.id)
    .limit(4)

  // 轉換相關酒款的 wineries 陣列
  const relatedWines = relatedWinesData?.map((w: any) => ({
    ...w,
    winery: Array.isArray(w.wineries) && w.wineries.length > 0 
      ? w.wineries[0] 
      : null
  })) || []

  return (
    <>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 mb-12 md:mb-24">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-white">
              <Image
                src={wine.image_url || '/placeholder-wine.png'}
                alt={wine.name}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            {wine.gallery_urls && wine.gallery_urls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {wine.gallery_urls.map((url: string, index: number) => (
                  <div key={index} className="relative aspect-square bg-white">
                    <Image
                      src={url}
                      alt={`${wine.name} ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Wine Info */}
          <div className="space-y-4 md:space-y-6">
            <div>
              <p className="font-serif text-xs md:text-sm text-secondary-grey-600 mb-2">
                {wine.winery?.name || 'Unknown Winery'}
              </p>
              <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-dark mb-2">
                {wine.name}
              </h1>
              {wine.vintage && (
                <p className="font-sans text-lg md:text-xl text-secondary-grey-400">
                  {wine.vintage}
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <p className="font-display text-3xl md:text-4xl font-bold text-primary-gold">
                {formatPrice(wine.price)}
              </p>
              {wine.original_price && wine.original_price > wine.price && (
                <p className="font-sans text-base md:text-lg text-secondary-grey-400 line-through">
                  {formatPrice(wine.original_price)}
                </p>
              )}
            </div>

            {wine.tasting_notes && (
              <div>
                <h3 className="font-serif text-lg md:text-xl font-semibold mb-3">品飲筆記</h3>
                <p className="font-sans text-sm md:text-base text-secondary-grey-600 leading-relaxed">
                  {wine.tasting_notes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:gap-4 py-4 md:py-6 border-y border-secondary-grey-200">
              <div>
                <p className="font-sans text-xs md:text-sm text-secondary-grey-400 mb-1">產區</p>
                <p className="font-serif text-sm md:text-base text-primary-dark">
                  {wine.region || '-'}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs md:text-sm text-secondary-grey-400 mb-1">葡萄品種</p>
                <p className="font-serif text-sm md:text-base text-primary-dark">
                  {wine.varietal}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs md:text-sm text-secondary-grey-400 mb-1">酒精度</p>
                <p className="font-serif text-sm md:text-base text-primary-dark">
                  {wine.alcohol_content ? `${wine.alcohol_content}%` : '-'}
                </p>
              </div>
              <div>
                <p className="font-sans text-xs md:text-sm text-secondary-grey-400 mb-1">容量</p>
                <p className="font-serif text-sm md:text-base text-primary-dark">
                  {wine.volume}ml
                </p>
              </div>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex gap-4">
              <Button variant="default" size="lg" className="flex-1">
                立即詢價
              </Button>
              <Button variant="outline" size="lg">
                加入願望清單
              </Button>
            </div>

            {wine.stock < 10 && wine.stock > 0 && (
              <p className="font-sans text-sm text-warning">
                ⚠️ 庫存僅剩 {wine.stock} 瓶
              </p>
            )}
            {wine.stock === 0 && (
              <p className="font-sans text-sm text-error">❌ 目前缺貨</p>
            )}
          </div>
        </div>

        {/* Inquiry Form - Desktop */}
        <div className="hidden md:block mb-24">
          <InquiryForm wineIds={[wine.id]} />
        </div>

        {/* Related Wines */}
        {relatedWines && relatedWines.length > 0 && (
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-dark mb-8 md:mb-12">
              您可能也喜歡
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {relatedWines.map((relatedWine) => (
                <WineCard key={relatedWine.id} wine={relatedWine} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Inquiry Button */}
      <MobileInquiryButton wineIds={[wine.id]} />
    </>
  )
}
