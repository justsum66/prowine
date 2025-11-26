import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { WineCard } from '@/components/cards/WineCard'
import { Button } from '@/components/ui/Button'
import { InquiryForm } from '@/components/inquiry/InquiryForm'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function WineryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: winery, error } = await supabase
    .from('wineries')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !winery) {
    notFound()
  }

  // 獲取該酒莊的酒款
  const { data: wines } = await supabase
    .from('wines')
    .select('*, wineries(*)')
    .eq('winery_id', winery.id)
    .eq('is_available', true)
    .order('price', { ascending: true })

  return (
    <>
      {/* Hero Section - 21:9 */}
      <section className="relative aspect-[21/9] overflow-hidden">
        {winery.hero_image_url && (
          <Image
            src={winery.hero_image_url}
            alt={winery.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          {winery.logo_url && (
            <div className="relative w-32 h-32 drop-shadow-2xl">
              <Image
                src={winery.logo_url}
                alt={`${winery.name} Logo`}
                fill
                className="object-contain filter brightness-0 invert"
              />
            </div>
          )}
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Winery Info */}
        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-bold text-primary-dark mb-4">
            {winery.name}
          </h1>
          {winery.established && (
            <p className="font-sans text-base text-secondary-grey-400 tracking-widest mb-6">
              EST. {winery.established}
            </p>
          )}
          <p className="font-serif text-lg text-secondary-grey-600 max-w-3xl mx-auto leading-relaxed">
            {winery.description || winery.story}
          </p>
        </div>

        {/* Story Section */}
        {winery.story && (
          <section id="story" className="mb-24">
            <h2 className="font-display text-4xl font-bold text-primary-dark mb-8">
              酒莊故事
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="font-serif text-base text-secondary-grey-600 leading-relaxed whitespace-pre-line">
                {winery.story}
              </p>
            </div>
          </section>
        )}

        {/* Wines from this Winery */}
        {wines && wines.length > 0 && (
          <section className="mb-24">
            <h2 className="font-display text-4xl font-bold text-primary-dark mb-12">
              {winery.name} 酒款
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {wines.map((wine) => (
                <WineCard key={wine.id} wine={wine} />
              ))}
            </div>
          </section>
        )}

        {/* Inquiry Form */}
        <section>
          <InquiryForm inquiryType="bulk" />
        </section>
      </div>
    </>
  )
}

