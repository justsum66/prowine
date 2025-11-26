import { createClient } from '@/lib/supabase/server'
import { WineCard } from '@/components/cards/WineCard'
import { Button } from '@/components/ui/Button'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function WinesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  
  let wines = null
  let hasError = false

  try {
    const supabase = await createClient()
    let query = supabase
      .from('wines')
      .select('*, wineries(*)')
      .eq('is_available', true)

    // 篩選邏輯
    if (params.wine_type) {
      const wineType = Array.isArray(params.wine_type) ? params.wine_type[0] : params.wine_type
      query = query.eq('wine_type', wineType)
    }
    if (params.region) {
      const region = Array.isArray(params.region) ? params.region[0] : params.region
      query = query.eq('region', region)
    }
    if (params.min_price) {
      const minPrice = Array.isArray(params.min_price) ? params.min_price[0] : params.min_price
      query = query.gte('price', Number(minPrice))
    }
    if (params.max_price) {
      const maxPrice = Array.isArray(params.max_price) ? params.max_price[0] : params.max_price
      query = query.lte('price', Number(maxPrice))
    }

    // 排序
    const sortBy = Array.isArray(params.sort) ? params.sort[0] : params.sort || 'created_at'
    const sortOrder = (Array.isArray(params.order) ? params.order[0] : params.order) === 'asc' ? 'asc' : 'desc'
    query = query.order(sortBy as any, { ascending: sortOrder === 'asc' })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching wines:', error)
      hasError = true
    } else {
      // 將 wineries 陣列轉換為單一 winery 物件
      wines = data?.map((wine: any) => ({
        ...wine,
        winery: Array.isArray(wine.wineries) && wine.wineries.length > 0 
          ? wine.wineries[0] 
          : null
      })) || null
    }
  } catch (error) {
    console.error('Error fetching wines:', error)
    hasError = true
  }

  // 確保即使有錯誤也顯示頁面內容
  return (
    <div className="container mx-auto px-4 py-12 md:py-24 max-w-7xl">
      <div className="mb-12 md:mb-16">
        <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-dark mb-4">
          所有酒款
        </h1>
        <p className="font-sans text-base md:text-lg text-secondary-grey-600">
          探索我們的精選葡萄酒收藏
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 md:mb-12 flex flex-wrap gap-3 md:gap-4 overflow-x-auto pb-2 md:pb-0">
        <Button variant="outline" size="sm" href="/wines" className="touch-target whitespace-nowrap">
          全部
        </Button>
        <Button variant="outline" size="sm" href="/wines?wine_type=red" className="touch-target whitespace-nowrap">
          紅酒
        </Button>
        <Button variant="outline" size="sm" href="/wines?wine_type=white" className="touch-target whitespace-nowrap">
          白酒
        </Button>
        <Button variant="outline" size="sm" href="/wines?wine_type=sparkling" className="touch-target whitespace-nowrap">
          氣泡酒
        </Button>
        <Button variant="outline" size="sm" href="/wines?wine_type=rose" className="touch-target whitespace-nowrap">
          粉紅酒
        </Button>
      </div>

      {/* Wine Grid */}
      {hasError ? (
        <div className="text-center py-16">
          <p className="font-sans text-lg text-secondary-grey-600 mb-4">
            資料載入錯誤，請稍後再試
          </p>
          <p className="font-sans text-sm text-secondary-grey-400">
            如果問題持續，請聯繫技術支援
          </p>
        </div>
      ) : wines && wines.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {wines.map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-sans text-lg text-secondary-grey-600">
            目前沒有符合條件的酒款
          </p>
        </div>
      )}
    </div>
  )
}
