import { config } from 'dotenv'
import { resolve } from 'path'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '@/lib/supabase/admin'
import axios from 'axios'
import * as cheerio from 'cheerio'

const supabase = createAdminClient()

interface WineData {
  name: string
  winery: string
  vintage?: number
  varietal: string
  price: number
  image_url: string
  description?: string
  region?: string
  wine_type: string
  tasting_notes?: string
}

interface WineryData {
  name: string
  region: string
  country: string
  description?: string
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function detectWineType(name: string, varietal: string): string {
  const text = `${name} ${varietal}`.toLowerCase()
  if (text.includes('champagne') || text.includes('sparkling') || text.includes('氣泡')) return 'sparkling'
  if (text.includes('rose') || text.includes('rosé') || text.includes('粉紅')) return 'rose'
  if (text.includes('chardonnay') || text.includes('sauvignon blanc') || text.includes('riesling') || text.includes('白酒')) return 'white'
  return 'red'
}

async function checkTablesExist() {
  const tables = ['wineries', 'wines']
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.error(`❌ 表格 ${table} 不存在！`)
      console.error(`   請先在Supabase SQL Editor執行 scripts/database/schema.sql`)
      return false
    }
  }
  return true
}

async function scrapeWines(): Promise<WineData[]> {
  console.log('🍷 開始快速爬取酒款資料...')
  const wines: WineData[] = []
  
  try {
    const response = await axios.get('http://prowine.com.tw', { timeout: 30000 })
    const $ = cheerio.load(response.data)
    
    // 從最新酒款和熱銷酒款區塊提取
    const wineLinks: string[] = []
    $('a[href*="?wine="]').each((_, el) => {
      const href = $(el).attr('href')
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `http://prowine.com.tw${href}`
        if (!wineLinks.includes(fullUrl)) {
          wineLinks.push(fullUrl)
        }
      }
    })

    console.log(`找到 ${wineLinks.length} 個酒款連結`)

    // 爬取前30個酒款詳情頁
    for (const link of wineLinks.slice(0, 30)) {
      try {
        const wineResponse = await axios.get(link, { timeout: 30000 })
        const $wine = cheerio.load(wineResponse.data)

        const name = $wine('h1').first().text().trim() || $wine('title').text().split('|')[0].trim()
        if (!name || name.length < 3) continue

        // 提取價格
        const priceText = $wine('strong:contains("品酩價"), .price, td:contains("品酩價")').first().text().trim() || 
                         $wine('*:contains("品酩價")').first().text().trim() || '0'
        const priceMatch = priceText.match(/[\d,]+/)
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : Math.floor(Math.random() * 5000) + 1000

        // 提取圖片
        const imageUrl = $wine('img[src*="wine"], img[src*="WINE"], img[src*="wine"]').first().attr('src') || 
                        $wine('img').not('[src*="logo"], [src*="icon"]').first().attr('src') || ''
        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://prowine.com.tw${imageUrl}`

        // 提取資訊
        const varietal = $wine('td:contains("葡萄種類")').next().text().trim() || 
                        $wine('*:contains("葡萄種類")').next().text().trim() || '混釀'
        const region = $wine('td:contains("酒品產區")').next().text().trim() || 
                      $wine('*:contains("酒品產區")').next().text().trim() || '法國'
        const wineType = $wine('td:contains("酒品類型")').next().text().trim() || '紅酒'

        // 提取描述
        const description = $wine('.wine-description, .entry-content, .content').first().text().trim() || 
                           $wine('p').slice(2, 5).text().trim() || ''
        const tastingNotes = $wine('h2:contains("品酒筆記"), h3:contains("品酒筆記")').next().text().trim() || 
                           $wine('*:contains("品酒筆記")').next().text().trim() || description

        // 提取年份
        const vintageMatch = name.match(/\b(19|20)\d{2}\b/)
        const vintage = vintageMatch ? parseInt(vintageMatch[0]) : undefined

        // 提取酒莊名
        const wineryName = name.split(/\s+/)[0] || 'Unknown'

        wines.push({
          name,
          winery: wineryName,
          vintage,
          varietal,
          price,
          image_url: fullImageUrl,
          description,
          region,
          wine_type: detectWineType(name, varietal),
          tasting_notes: tastingNotes.substring(0, 500),
        })

        console.log(`✅ 爬取: ${name}`)
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error: any) {
        console.error(`❌ 爬取失敗: ${link}`, error.message)
      }
    }
    
    console.log(`✅ 總共爬取到 ${wines.length} 支酒款`)
  } catch (error) {
    console.error('❌ 爬取失敗:', error)
  }
  
  return wines
}

async function scrapeWineries(wines: WineData[]): Promise<WineryData[]> {
  console.log('🏭 開始提取酒莊資料...')
  const wineries: WineryData[] = []
  const wineryNames = new Set<string>()
  
  // 從酒款中提取酒莊
  wines.forEach(wine => {
    if (wine.winery && wine.winery !== 'Unknown' && !wineryNames.has(wine.winery)) {
      wineryNames.add(wine.winery)
      wineries.push({
        name: wine.winery,
        region: wine.region || '法國',
        country: '法國',
      })
    }
  })
  
  console.log(`✅ 找到 ${wineries.length} 個酒莊`)
  return wineries
}

async function saveToDatabase(wineries: WineryData[], wines: WineData[]) {
  console.log('💾 開始保存資料到Supabase...')
  
  // 保存酒莊
  for (const winery of wineries) {
    try {
      const slug = generateSlug(winery.name)
      const { error } = await supabase.from('wineries').upsert({
        slug,
        name: winery.name,
        region: winery.region,
        country: winery.country,
        description: winery.description,
      }, { onConflict: 'slug' })
      
      if (error) {
        console.error(`❌ 保存酒莊失敗: ${winery.name}`, error.message)
      } else {
        console.log(`✅ 保存酒莊: ${winery.name}`)
      }
    } catch (error: any) {
      console.error(`❌ 處理酒莊 ${winery.name} 時發生錯誤:`, error.message)
    }
  }
  
  // 保存酒款
  for (const wine of wines) {
    try {
      // 查找或創建酒莊
      let wineryId: string | null = null
      
      const { data: wineryData } = await supabase
        .from('wineries')
        .select('id')
        .ilike('name', `%${wine.winery}%`)
        .single()
      
      if (wineryData) {
        wineryId = wineryData.id
      } else {
        // 創建新酒莊
        const winerySlug = generateSlug(wine.winery)
        const { data: newWinery, error: wineryError } = await supabase
          .from('wineries')
          .upsert({
            slug: winerySlug,
            name: wine.winery,
            region: wine.region || '法國',
            country: '法國',
          }, { onConflict: 'slug' })
          .select()
          .single()
        
        if (newWinery) {
          wineryId = newWinery.id
        } else {
          console.log(`⚠️  無法創建酒莊 ${wine.winery}，跳過`)
          continue
        }
      }
      
      if (!wineryId) continue
      
      const slug = generateSlug(`${wine.name}-${wine.vintage || 'nv'}`)
      const { error } = await supabase.from('wines').upsert({
        winery_id: wineryId,
        slug,
        name: wine.name,
        vintage: wine.vintage,
        varietal: wine.varietal,
        price: wine.price,
        image_url: wine.image_url || '/placeholder-wine.png',
        wine_type: wine.wine_type,
        tasting_notes: wine.tasting_notes || wine.description,
        region: wine.region,
        stock: Math.floor(Math.random() * 50) + 10,
        is_available: true,
        is_featured: Math.random() > 0.7,
      }, { onConflict: 'slug' })
      
      if (error) {
        console.error(`❌ 保存酒款失敗: ${wine.name}`, error.message)
      } else {
        console.log(`✅ 保存酒款: ${wine.name}`)
      }
    } catch (error: any) {
      console.error(`❌ 處理酒款 ${wine.name} 時發生錯誤:`, error.message)
    }
  }
  
  console.log('✅ 資料保存完成')
}

async function main() {
  console.log('🚀 ProWine 快速資料爬取系統')
  console.log('================================\n')
  
  // 檢查表格是否存在
  const tablesExist = await checkTablesExist()
  if (!tablesExist) {
    console.log('\n❌ 資料庫表格不存在！')
    console.log('請執行以下步驟：')
    console.log('1. 登入 Supabase Dashboard')
    console.log('2. 進入 SQL Editor')
    console.log('3. 執行 scripts/database/schema.sql 的內容')
    process.exit(1)
  }
  
  try {
    const wines = await scrapeWines()
    const wineries = await scrapeWineries(wines)
    
    await saveToDatabase(wineries, wines)
    
    console.log('\n📊 爬取統計:')
    console.log('================================')
    console.log(`酒莊: ${wineries.length} 個`)
    console.log(`酒款: ${wines.length} 支`)
    console.log('================================')
    console.log('\n✅ 全部完成！')
  } catch (error: any) {
    console.error('\n❌ 發生錯誤:', error.message)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

