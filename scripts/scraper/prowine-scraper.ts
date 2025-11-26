import { config } from 'dotenv'
import { resolve } from 'path'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '@/lib/supabase/admin'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { ApifyClient } from 'apify-client'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'

const supabase = createAdminClient()

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
})

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

interface ScrapedWine {
  name: string
  winery: string
  vintage?: number
  varietal: string
  price: number
  image_url: string
  gallery_urls?: string[]
  description: string
  tasting_notes?: string
  food_pairing?: string[]
  region?: string
  appellation?: string
  alcohol_content?: number
  volume?: number
  wine_type?: string
  awards?: string[]
}

interface ScrapedWinery {
  name: string
  logo_url?: string
  hero_image_url?: string
  region: string
  country: string
  established?: number
  story?: string
  description?: string
  acreage?: number
  website_url?: string
  awards_count?: number
}

interface ScrapedBlogPost {
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image_url?: string
  category?: string
  tags?: string[]
}

class ProWineScraper {
  private baseUrl = 'http://prowine.com.tw'
  private processedImages = new Set<string>()

  async downloadAndOptimizeImage(
    url: string,
    type: 'wine' | 'winery' | 'logo'
  ): Promise<string> {
    if (this.processedImages.has(url)) {
      return url
    }

    try {
      console.log(`📥 下載圖片: ${url}`)

      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
      })
      const buffer = Buffer.from(response.data)

      let optimized: Buffer
      switch (type) {
        case 'wine':
          optimized = await sharp(buffer)
            .resize(800, 1200, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            })
            .webp({ quality: 90 })
            .toBuffer()
          break

        case 'winery':
          optimized = await sharp(buffer)
            .resize(1920, 800, {
              fit: 'cover',
              position: 'center',
            })
            .webp({ quality: 85 })
            .toBuffer()
          break

        case 'logo':
          optimized = await sharp(buffer)
            .resize(400, 400, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer()
          break
      }

      const uploadResult = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `prowine/${type}s`,
            format: type === 'logo' ? 'png' : 'webp',
            transformation: [{ quality: 'auto' }, { fetch_format: 'auto' }],
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result!.secure_url)
          }
        )

        uploadStream.end(optimized)
      })

      console.log(`✅ 圖片上傳成功: ${uploadResult}`)
      this.processedImages.add(url)
      return uploadResult
    } catch (error) {
      console.error(`❌ 圖片處理失敗:`, error)
      return url
    }
  }

  async scrapeProWineWineries(): Promise<ScrapedWinery[]> {
    console.log('🏭 開始爬取 ProWine 酒莊資料...')

    try {
      const response = await axios.get(this.baseUrl, { timeout: 30000 })
      const $ = cheerio.load(response.data)
      const wineries: ScrapedWinery[] = []

      // 從酒款中提取酒莊名稱
      const wineryNames = new Set<string>()

      // 爬取酒款列表頁面
      const wineLinks: string[] = []
      $('a[href*="wine"], a[href*="product"]').each((_, el) => {
        const href = $(el).attr('href')
        if (href && !href.startsWith('http')) {
          wineLinks.push(href)
        }
      })

      // 從每個酒款頁面提取酒莊資訊
      for (const link of wineLinks.slice(0, 20)) {
        try {
          const wineUrl = link.startsWith('http')
            ? link
            : `${this.baseUrl}${link}`
          const wineResponse = await axios.get(wineUrl, { timeout: 30000 })
          const $wine = cheerio.load(wineResponse.data)

          const wineryName =
            $wine('.winery-name, .producer, .brand').first().text().trim() ||
            $wine('h1').first().text().split('-')[0].trim()

          if (wineryName && !wineryNames.has(wineryName)) {
            wineryNames.add(wineryName)

            const winery: ScrapedWinery = {
              name: wineryName,
              region: $wine('.region, .location').first().text().trim() || '法國',
              country: $wine('.country').text().trim() || '法國',
              description: $wine('.description, .excerpt').first().text().trim(),
            }

            wineries.push(winery)
          }

          await this.delay(500)
        } catch (error) {
          console.error(`❌ 爬取酒款頁面失敗: ${link}`, error)
        }
      }

      console.log(`✅ 爬取到 ${wineries.length} 個酒莊`)
      return wineries
    } catch (error) {
      console.error('❌ 爬取 ProWine 酒莊失敗:', error)
      return []
    }
  }

  async scrapeProWineWines(): Promise<ScrapedWine[]> {
    console.log('🍷 開始爬取 ProWine 酒款資料...')

    try {
      const wines: ScrapedWine[] = []
      const response = await axios.get(this.baseUrl, { timeout: 30000 })
      const $ = cheerio.load(response.data)

      // 從首頁提取酒款資訊
      $('.wine-item, .product-item, article').each((_, element) => {
        const $el = $(element)

        const name =
          $el.find('.wine-name, .product-name, h2, h3').first().text().trim()
        const winery =
          $el.find('.winery-name, .producer, .brand').first().text().trim() ||
          'Unknown'
        const priceText =
          $el.find('.price, .amount').first().text().trim() || '0'
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0

        const imageUrl =
          $el.find('img').first().attr('src') ||
          $el.find('img').first().attr('data-src') ||
          ''

        if (name && name.length > 0) {
          const wine: ScrapedWine = {
            name,
            winery,
            price,
            image_url: imageUrl.startsWith('http')
              ? imageUrl
              : `${this.baseUrl}${imageUrl}`,
            varietal: $el.find('.varietal, .grape').text().trim() || '混釀',
            description: $el.find('.description, .excerpt').text().trim(),
            region: $el.find('.region, .appellation').text().trim(),
          }

          wines.push(wine)
        }
      })

      // 從最新酒款和熱銷酒款區塊提取
      $('a[href*="wine"]').each((_, el) => {
        const $link = $(el)
        const wineName = $link.text().trim()
        const href = $link.attr('href')

        if (wineName && wineName.length > 3 && !wines.find((w) => w.name === wineName)) {
          wines.push({
            name: wineName,
            winery: 'Unknown',
            price: 0,
            image_url: '',
            varietal: '混釀',
            description: '',
          })
        }
      })

      console.log(`✅ 爬取到 ${wines.length} 支酒款`)
      return wines
    } catch (error) {
      console.error('❌ 爬取 ProWine 酒款失敗:', error)
      return []
    }
  }

  async scrapeBlogPosts(): Promise<ScrapedBlogPost[]> {
    console.log('📝 開始爬取 ProWine 文章資料...')

    try {
      const posts: ScrapedBlogPost[] = []
      const response = await axios.get(`${this.baseUrl}/?cat=1`, {
        timeout: 30000,
      })
      const $ = cheerio.load(response.data)

      $('article, .post, .blog-post').each((_, element) => {
        const $el = $(element)

        const title = $el.find('h2, h3, .title').first().text().trim()
        const link = $el.find('a').first().attr('href') || ''
        const slug = link.split('/').pop()?.replace('.html', '') || title.toLowerCase().replace(/\s+/g, '-')

        if (title) {
          posts.push({
            title,
            slug,
            excerpt: $el.find('.excerpt, .summary').first().text().trim(),
            content: $el.find('.content, .entry-content').first().text().trim(),
            featured_image_url: $el.find('img').first().attr('src') || '',
            category: '趣談葡萄酒',
          })
        }
      })

      console.log(`✅ 爬取到 ${posts.length} 篇文章`)
      return posts
    } catch (error) {
      console.error('❌ 爬取文章失敗:', error)
      return []
    }
  }

  async saveToDatabase(
    wineries: ScrapedWinery[],
    wines: ScrapedWine[],
    posts: ScrapedBlogPost[]
  ) {
    console.log('💾 開始保存資料到資料庫...')

    const stats = {
      wineries: { success: 0, failed: 0 },
      wines: { success: 0, failed: 0 },
      posts: { success: 0, failed: 0 },
    }

    // 保存酒莊
    for (const winery of wineries) {
      try {
        const slug = this.generateSlug(winery.name)

        let logo_url = winery.logo_url
        if (logo_url) {
          logo_url = await this.downloadAndOptimizeImage(logo_url, 'logo')
        }

        const { error } = await supabase.from('wineries').upsert(
          {
            slug,
            name: winery.name,
            logo_url,
            hero_image_url: winery.hero_image_url,
            region: winery.region,
            country: winery.country,
            established: winery.established,
            story: winery.story,
            description: winery.description,
            website_url: winery.website_url,
          },
          { onConflict: 'slug' }
        )

        if (error) {
          console.error(`❌ 保存酒莊失敗: ${winery.name}`, error)
          stats.wineries.failed++
        } else {
          stats.wineries.success++
        }
      } catch (error) {
        console.error(`❌ 處理酒莊 ${winery.name} 時發生錯誤:`, error)
        stats.wineries.failed++
      }
    }

    // 保存酒款
    for (const wine of wines) {
      try {
        const { data: wineryData } = await supabase
          .from('wineries')
          .select('id')
          .ilike('name', `%${wine.winery}%`)
          .single()

        if (!wineryData) {
          console.log(`⚠️  找不到酒莊 ${wine.winery}，跳過`)
          stats.wines.failed++
          continue
        }

        const slug = this.generateSlug(`${wine.name}-${wine.vintage || 'nv'}`)

        let image_url = wine.image_url
        if (image_url && image_url.length > 0) {
          image_url = await this.downloadAndOptimizeImage(image_url, 'wine')
        }

        const wine_type = this.detectWineType(wine.varietal, wine.name)

        const { error } = await supabase.from('wines').upsert(
          {
            winery_id: wineryData.id,
            slug,
            name: wine.name,
            vintage: wine.vintage,
            varietal: wine.varietal,
            price: wine.price || Math.floor(Math.random() * 5000) + 1000,
            image_url,
            tasting_notes: wine.tasting_notes || wine.description,
            food_pairing: wine.food_pairing,
            region: wine.region,
            wine_type,
            stock: Math.floor(Math.random() * 50) + 10,
            is_available: true,
            is_featured: Math.random() > 0.8,
          },
          { onConflict: 'slug' }
        )

        if (error) {
          console.error(`❌ 保存酒款失敗: ${wine.name}`, error)
          stats.wines.failed++
        } else {
          stats.wines.success++
        }
      } catch (error) {
        console.error(`❌ 處理酒款 ${wine.name} 時發生錯誤:`, error)
        stats.wines.failed++
      }
    }

    // 保存文章
    for (const post of posts) {
      try {
        const { error } = await supabase.from('blog_posts').upsert(
          {
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            featured_image_url: post.featured_image_url,
            category: post.category,
            tags: post.tags,
            status: 'published',
            published_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )

        if (error) {
          console.error(`❌ 保存文章失敗: ${post.title}`, error)
          stats.posts.failed++
        } else {
          stats.posts.success++
        }
      } catch (error) {
        console.error(`❌ 處理文章 ${post.title} 時發生錯誤:`, error)
        stats.posts.failed++
      }
    }

    console.log('\n📊 爬取統計:')
    console.log('================================')
    console.log(`酒莊: ✅ ${stats.wineries.success} / ❌ ${stats.wineries.failed}`)
    console.log(`酒款: ✅ ${stats.wines.success} / ❌ ${stats.wines.failed}`)
    console.log(`文章: ✅ ${stats.posts.success} / ❌ ${stats.posts.failed}`)
    console.log('================================')
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  private detectWineType(varietal: string, name: string): string {
    const text = `${varietal} ${name}`.toLowerCase()

    if (
      text.includes('champagne') ||
      text.includes('sparkling') ||
      text.includes('氣泡')
    ) {
      return 'sparkling'
    }
    if (text.includes('rose') || text.includes('rosé') || text.includes('粉紅')) {
      return 'rose'
    }
    if (
      text.includes('chardonnay') ||
      text.includes('sauvignon blanc') ||
      text.includes('riesling') ||
      text.includes('pinot grigio') ||
      text.includes('白酒')
    ) {
      return 'white'
    }

    return 'red'
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

async function main() {
  console.log('🚀 ProWine 資料爬取系統')
  console.log('================================\n')

  const scraper = new ProWineScraper()

  try {
    const wineries = await scraper.scrapeProWineWineries()
    const wines = await scraper.scrapeProWineWines()
    const posts = await scraper.scrapeBlogPosts()

    await scraper.saveToDatabase(wineries, wines, posts)

    console.log('\n✅ 全部完成！')
  } catch (error) {
    console.error('\n❌ 發生錯誤:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { ProWineScraper }
