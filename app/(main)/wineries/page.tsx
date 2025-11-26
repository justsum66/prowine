import { createClient } from '@/lib/supabase/server'
import { WineryCard } from '@/components/cards/WineryCard'

// 強制動態渲染（因為使用 cookies）
export const dynamic = 'force-dynamic'

export default async function WineriesPage() {
  const supabase = await createClient()

  let wineries = null
  let hasError = false

  try {
    const { data, error } = await supabase
      .from('wineries')
      .select('*')
      .order('awards_count', { ascending: false })
    
    if (error) {
      console.error('Error fetching wineries:', error)
      hasError = true
    } else {
      wineries = data
    }
  } catch (error) {
    console.error('Error fetching wineries:', error)
    hasError = true
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="font-display text-5xl font-bold text-primary-dark mb-4">
          所有酒莊
        </h1>
        <p className="font-sans text-lg text-secondary-grey-600">
          探索來自法國優質產區的傳奇酒莊
        </p>
      </div>

      {hasError ? (
        <div className="text-center py-16">
          <p className="font-sans text-lg text-secondary-grey-600 mb-4">
            資料載入錯誤，請稍後再試
          </p>
          <p className="font-sans text-sm text-secondary-grey-400">
            如果問題持續，請聯繫技術支援
          </p>
        </div>
      ) : wineries && wineries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wineries.map((winery, index) => (
            <WineryCard
              key={winery.id}
              winery={winery}
              featured={index === 0}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="font-sans text-lg text-secondary-grey-600">
            目前沒有酒莊資料
          </p>
        </div>
      )}
    </div>
  )
}

