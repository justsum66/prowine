/**
 * 測試所有頁面是否正常顯示
 * 檢查圖片、文字、導航是否正常
 */

import { createAdminClient } from '@/lib/supabase/admin'

async function testPages() {
  console.log('🧪 開始測試所有頁面...\n')

  const supabase = createAdminClient()

  // 測試1: 檢查首頁資料
  console.log('📋 測試1: 檢查首頁資料...')
  try {
    const { data: wines, error: winesError } = await supabase
      .from('wines')
      .select('*, wineries(*)')
      .eq('is_featured', true)
      .eq('is_available', true)
      .limit(8)

    if (winesError) {
      console.error('❌ 首頁酒款查詢失敗:', winesError)
    } else {
      console.log(`✅ 首頁酒款: ${wines?.length || 0} 支`)
      if (wines && wines.length > 0) {
        const withImages = wines.filter(w => w.image_url)
        console.log(`   - 有圖片: ${withImages.length}/${wines.length}`)
        const withTastingNotes = wines.filter(w => w.tasting_notes && w.tasting_notes.length > 0)
        console.log(`   - 有品飲筆記: ${withTastingNotes.length}/${wines.length}`)
      }
    }

    const { data: wineries, error: wineriesError } = await supabase
      .from('wineries')
      .select('*')
      .order('awards_count', { ascending: false })
      .limit(6)

    if (wineriesError) {
      console.error('❌ 首頁酒莊查詢失敗:', wineriesError)
    } else {
      console.log(`✅ 首頁酒莊: ${wineries?.length || 0} 個`)
      if (wineries && wineries.length > 0) {
        const withLogos = wineries.filter(w => w.logo_url)
        console.log(`   - 有Logo: ${withLogos.length}/${wineries.length}`)
        const withHeroImages = wineries.filter(w => w.hero_image_url)
        console.log(`   - 有Hero圖片: ${withHeroImages.length}/${wineries.length}`)
      }
    }
  } catch (error) {
    console.error('❌ 首頁測試失敗:', error)
  }

  // 測試2: 檢查酒款列表頁
  console.log('\n📋 測試2: 檢查酒款列表頁...')
  try {
    const { data: allWines, error } = await supabase
      .from('wines')
      .select('*, wineries(*)')
      .eq('is_available', true)
      .limit(20)

    if (error) {
      console.error('❌ 酒款列表查詢失敗:', error)
    } else {
      console.log(`✅ 可用酒款: ${allWines?.length || 0} 支`)
      if (allWines && allWines.length > 0) {
        const withWinery = allWines.filter(w => 
          Array.isArray(w.wineries) && w.wineries.length > 0
        )
        console.log(`   - 有酒莊關聯: ${withWinery.length}/${allWines.length}`)
        const withImages = allWines.filter(w => w.image_url)
        console.log(`   - 有圖片: ${withImages.length}/${allWines.length}`)
      }
    }
  } catch (error) {
    console.error('❌ 酒款列表測試失敗:', error)
  }

  // 測試3: 檢查酒莊列表頁
  console.log('\n📋 測試3: 檢查酒莊列表頁...')
  try {
    const { data: allWineries, error } = await supabase
      .from('wineries')
      .select('*')
      .limit(20)

    if (error) {
      console.error('❌ 酒莊列表查詢失敗:', error)
    } else {
      console.log(`✅ 酒莊總數: ${allWineries?.length || 0} 個`)
      if (allWineries && allWineries.length > 0) {
        const withLogos = allWineries.filter(w => w.logo_url)
        console.log(`   - 有Logo: ${withLogos.length}/${allWineries.length}`)
      }
    }
  } catch (error) {
    console.error('❌ 酒莊列表測試失敗:', error)
  }

  // 測試4: 檢查文章頁面
  console.log('\n📋 測試4: 檢查文章頁面...')
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      console.error('❌ 文章查詢失敗:', error)
    } else {
      console.log(`✅ 已發布文章: ${posts?.length || 0} 篇`)
    }
  } catch (error) {
    console.error('❌ 文章測試失敗:', error)
  }

  // 測試5: 檢查資料完整性
  console.log('\n📋 測試5: 檢查資料完整性...')
  try {
    const { data: wines, error: winesError } = await supabase
      .from('wines')
      .select('id, name, image_url, tasting_notes, winery_id')

    if (winesError) {
      console.error('❌ 資料完整性檢查失敗:', winesError)
    } else if (wines) {
      const totalWines = wines.length
      const withImages = wines.filter(w => w.image_url && w.image_url.length > 0).length
      const withTastingNotes = wines.filter(w => w.tasting_notes && w.tasting_notes.length > 0).length
      const withWinery = wines.filter(w => w.winery_id).length

      console.log(`✅ 資料完整性統計:`)
      console.log(`   - 總酒款數: ${totalWines}`)
      console.log(`   - 有圖片: ${withImages} (${Math.round(withImages/totalWines*100)}%)`)
      console.log(`   - 有品飲筆記: ${withTastingNotes} (${Math.round(withTastingNotes/totalWines*100)}%)`)
      console.log(`   - 有酒莊關聯: ${withWinery} (${Math.round(withWinery/totalWines*100)}%)`)
    }
  } catch (error) {
    console.error('❌ 資料完整性檢查失敗:', error)
  }

  console.log('\n✅ 測試完成！')
}

if (require.main === module) {
  testPages().catch(console.error)
}

export { testPages }

