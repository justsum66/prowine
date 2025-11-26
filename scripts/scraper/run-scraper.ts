/**
 * 爬蟲執行腳本
 * 使用 dotenv 載入環境變數
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// 載入 .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// 執行爬蟲
import('./prowine-scraper').then(({ ProWineScraper }) => {
  const scraper = new ProWineScraper()
  
  scraper.scrapeProWineWineries()
    .then((wineries) => {
      console.log(`✅ 爬取到 ${wineries.length} 個酒莊`)
      return scraper.scrapeProWineWines()
    })
    .then((wines) => {
      console.log(`✅ 爬取到 ${wines.length} 支酒款`)
      return scraper.scrapeBlogPosts()
    })
    .then((posts) => {
      console.log(`✅ 爬取到 ${posts.length} 篇文章`)
      console.log('\n✅ 全部完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ 發生錯誤:', error)
      process.exit(1)
    })
})

