import { config } from 'dotenv'
import { resolve } from 'path'

// 載入環境變數
config({ path: resolve(process.cwd(), '.env.local') })

import { createAdminClient } from '@/lib/supabase/admin'
import axios from 'axios'
import * as cheerio from 'cheerio'
import sharp from 'sharp'
import { v2 as cloudinary } from 'cloudinary'

const supabase = createAdminClient()

// 配置 Cloudinary（使用用戶提供的配置）
// 根據用戶說明：
// - Cloud Name: 341388744959128
// - API Key: 341388744959128 (KEY NAME: Root)
// - API Secret: WBzabsfAJFZ9rHhuk0RDSQlifwU
const cloudinaryConfig = {
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '341388744959128',
  api_key: process.env.CLOUDINARY_API_KEY || '341388744959128', // 用戶提供的 API Key
  api_secret: process.env.CLOUDINARY_API_SECRET || 'WBzabsfAJFZ9rHhuk0RDSQlifwU', // 用戶提供的 API Secret
}

// 如果環境變數中有配置，優先使用環境變數
if (process.env.CLOUDINARY_API_KEY) {
  cloudinaryConfig.api_key = process.env.CLOUDINARY_API_KEY
}
if (process.env.CLOUDINARY_API_SECRET) {
  cloudinaryConfig.api_secret = process.env.CLOUDINARY_API_SECRET
}

// 確保Cloudinary配置正確
if (cloudinaryConfig.cloud_name && cloudinaryConfig.api_key && cloudinaryConfig.api_secret) {
  try {
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloud_name,
      api_key: cloudinaryConfig.api_key,
      api_secret: cloudinaryConfig.api_secret,
      secure: true,
    })
    console.log('✅ Cloudinary 已配置')
    console.log('   Cloud Name:', cloudinaryConfig.cloud_name)
    console.log('   API Key:', cloudinaryConfig.api_key.substring(0, 10) + '...')
    console.log('   API Secret:', cloudinaryConfig.api_secret ? '***' : '(未設置)')
  } catch (error) {
    console.error('❌ Cloudinary 配置失敗:', error)
  }
} else {
  console.log('⚠️  Cloudinary 配置不完整')
  console.log('   已設置: cloud_name =', cloudinaryConfig.cloud_name || '(未設置)')
  console.log('   已設置: api_key =', cloudinaryConfig.api_key ? '***' : '(未設置)')
  console.log('   已設置: api_secret =', cloudinaryConfig.api_secret ? '***' : '(未設置)')
}

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
  story?: string
  logo_url?: string
  hero_image_url?: string
  website_url?: string
}

/**
 * 檢測圖片是否為酒瓶照片
 * 基於圖片特徵：比例、尺寸、文件名等
 */
async function isWineBottleImage(url: string): Promise<{ isBottle: boolean; confidence: number; aspectRatio: number }> {
  try {
    if (!url || url.length === 0) {
      return { isBottle: false, confidence: 0, aspectRatio: 0 }
    }
    
    // 檢查URL中是否包含相關關鍵詞
    const urlLower = url.toLowerCase()
    const bottleKeywords = ['bottle', 'wine', 'bottle', '酒瓶', 'wine-bottle']
    const hasBottleKeyword = bottleKeywords.some(keyword => urlLower.includes(keyword))
    
    // 檢查是否明顯不是酒瓶（logo、menu、nav等）
    const excludeKeywords = ['logo', 'menu', 'nav', 'header', 'icon', 'button', 'badge']
    const hasExcludeKeyword = excludeKeywords.some(keyword => urlLower.includes(keyword))
    
    if (hasExcludeKeyword) {
      return { isBottle: false, confidence: 0, aspectRatio: 0 }
    }
    
    // 下載圖片檢查實際尺寸和比例
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'Range': 'bytes=0-16384'
        }
      })
      
      const buffer = Buffer.from(response.data)
      const metadata = await sharp(buffer).metadata()
      
      const width = metadata.width || 0
      const height = metadata.height || 0
      
      if (width === 0 || height === 0) {
        return { isBottle: false, confidence: 0, aspectRatio: 0 }
      }
      
      const aspectRatio = width / height
      
      // 酒瓶照片通常是豎向的（高度大於寬度）
      // 理想比例：3:4 (0.75) 或接近
      const idealRatio = 3 / 4 // 0.75
      const ratioDiff = Math.abs(aspectRatio - idealRatio)
      
      // 檢查尺寸：酒瓶照片通常不會太小
      const minSize = 200 // 最小尺寸
      const meetsSize = width >= minSize && height >= minSize
      
      // 檢查是否為豎向（高度 > 寬度）
      const isPortrait = height > width
      
      // 計算信心分數
      let confidence = 0
      
      // 比例分數（最高40分）
      if (ratioDiff < 0.1) {
        confidence += 40 // 非常接近3:4
      } else if (ratioDiff < 0.2) {
        confidence += 30 // 接近3:4
      } else if (ratioDiff < 0.3) {
        confidence += 20 // 還算接近
      } else if (isPortrait) {
        confidence += 10 // 至少是豎向
      }
      
      // 尺寸分數（最高30分）
      if (meetsSize) {
        if (width >= 400 && height >= 600) {
          confidence += 30 // 理想尺寸
        } else if (width >= 300 && height >= 400) {
          confidence += 20 // 良好尺寸
        } else {
          confidence += 10 // 基本尺寸
        }
      }
      
      // URL關鍵詞分數（最高20分）
      if (hasBottleKeyword) {
        confidence += 20
      }
      
      // 豎向分數（最高10分）
      if (isPortrait) {
        confidence += 10
      }
      
      const isBottle = confidence >= 50 // 信心分數超過50認為是酒瓶
      
      return { isBottle, confidence, aspectRatio }
    } catch (error) {
      // 如果無法下載檢測，基於URL判斷
      return {
        isBottle: hasBottleKeyword && !hasExcludeKeyword,
        confidence: hasBottleKeyword ? 30 : 0,
        aspectRatio: 0
      }
    }
  } catch (error) {
    return { isBottle: false, confidence: 0, aspectRatio: 0 }
  }
}

/**
 * 檢測圖片品質（實際下載檢查尺寸）
 * 返回：{ width, height, qualityScore, isValid }
 * qualityScore: 0-100，基於尺寸和比例
 */
async function getImageQuality(url: string): Promise<{ width: number; height: number; qualityScore: number; isValid: boolean }> {
  try {
    if (!url || url.length === 0) {
      return { width: 0, height: 0, qualityScore: 0, isValid: false }
    }
    
    // 只下載圖片頭部來檢查尺寸（節省帶寬）
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'Range': 'bytes=0-16384' // 只下載前16KB，足夠獲取圖片元數據
      }
    })
    
    const buffer = Buffer.from(response.data)
    const metadata = await sharp(buffer).metadata()
    
    const width = metadata.width || 0
    const height = metadata.height || 0
    
    // 計算品質分數
    // 最低要求：1920x800px (21:9比例)
    // 理想標準：2400x1000px或更高
    let qualityScore = 0
    const minWidth = 1920
    const minHeight = 800
    const idealWidth = 2400
    const idealHeight = 1000
    
    // 檢查是否符合最低要求
    const meetsMinimum = width >= minWidth && height >= minHeight
    // 檢查是否符合理想標準
    const meetsIdeal = width >= idealWidth && height >= idealHeight
    
    // 計算比例分數（21:9 = 2.33）
    const aspectRatio = width / height
    const idealRatio = 21 / 9 // 2.33
    const ratioScore = 1 - Math.abs(aspectRatio - idealRatio) / idealRatio
    const ratioScoreClamped = Math.max(0, Math.min(1, ratioScore)) * 30 // 比例分數最高30分
    
    // 尺寸分數（最高70分）
    let sizeScore = 0
    if (meetsIdeal) {
      sizeScore = 70 // 達到理想標準，滿分
    } else if (meetsMinimum) {
      // 在最低和理想之間，線性插值
      const widthProgress = (width - minWidth) / (idealWidth - minWidth)
      const heightProgress = (height - minHeight) / (idealHeight - minHeight)
      const progress = Math.min(1, (widthProgress + heightProgress) / 2)
      sizeScore = 40 + (progress * 30) // 40-70分
    } else {
      // 低於最低要求，但至少有一定尺寸
      if (width >= 800 && height >= 400) {
        sizeScore = (width * height) / (minWidth * minHeight) * 40 // 0-40分
      }
    }
    
    qualityScore = Math.round(sizeScore + ratioScoreClamped)
    const isValid = meetsMinimum || (width >= 1200 && height >= 500) // 放寬一點標準
    
    return { width, height, qualityScore, isValid }
  } catch (error) {
    // 如果無法檢測，返回無效
    return { width: 0, height: 0, qualityScore: 0, isValid: false }
  }
}

/**
 * 從ProWine網站爬取Hero圖片
 */
async function scrapeHeroFromProWine(wineryName: string): Promise<{ hero_image_url?: string; qualityScore: number }> {
  try {
    // 搜索ProWine網站中與該酒莊相關的頁面
    const searchUrl = `http://prowine.com.tw/?s=${encodeURIComponent(wineryName)}`
    
    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    const $ = cheerio.load(response.data)
    
    // 查找可能的Hero圖片
    const heroSelectors = [
      '.hero-image img',
      '.banner img',
      '.header-image img',
      'img[src*="winery"]',
      'img[src*="vineyard"]',
      'img[src*="estate"]',
      'img[src*="chateau"]',
      '.slider img',
      '.carousel img',
      'main img[width][height]' // 有大尺寸屬性的圖片
    ]
    
    let bestHero: { url: string; qualityScore: number } | null = null
    
    for (const selector of heroSelectors) {
      const images = $(selector)
      
      for (let i = 0; i < Math.min(images.length, 5); i++) {
        const img = $(images[i])
        let src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || ''
        
        if (!src || src.includes('logo') || src.includes('menu') || src.includes('nav')) {
          continue
        }
        
        if (src && !src.startsWith('http')) {
          src = src.startsWith('/') ? `http://prowine.com.tw${src}` : `http://prowine.com.tw/${src}`
        }
        
        // 檢查HTML中的尺寸屬性
        const width = parseInt(img.attr('width') || '0')
        const height = parseInt(img.attr('height') || '0')
        
        // 如果HTML中有足夠大的尺寸標記，嘗試檢測實際品質
        if (width >= 800 || height >= 400) {
          const quality = await getImageQuality(src)
          if (quality.isValid && (!bestHero || quality.qualityScore > bestHero.qualityScore)) {
            bestHero = { url: src, qualityScore: quality.qualityScore }
          }
        }
      }
    }
    
    return {
      hero_image_url: bestHero?.url,
      qualityScore: bestHero?.qualityScore || 0
    }
  } catch (error) {
    return { qualityScore: 0 }
  }
}

/**
 * 從酒莊官網爬取高質量圖片（改進版：包含品質檢測）
 * 優先順序：官網 > ProWine
 */
async function scrapeWineryImagesFromOfficialSite(wineryName: string, region: string): Promise<{ logo_url?: string; hero_image_url?: string; website_url?: string; heroQualityScore?: number }> {
  const result: { logo_url?: string; hero_image_url?: string; website_url?: string; heroQualityScore?: number } = {}
  
  try {
    // 清理酒莊名稱：移除常見後綴，保留核心名稱
    // 同時移除特殊字符和數字，只保留字母和空格
    let cleanName = wineryName
      .replace(/\s+(Vineyards?|Estate|Chateau|Château|Domaine|Winery|Cellars?)\s*$/i, '')
      .replace(/[^\w\s-]/g, '') // 移除特殊字符（但保留連字符）
      .replace(/\d+/g, '') // 移除數字
      .replace(/\s+/g, ' ') // 多個空格變一個
      .replace(/[,\s]+/g, ' ') // 移除逗號和多餘空格
      .trim()
    
    // 如果名稱太長（超過30字符），只取前幾個單詞
    if (cleanName.length > 30) {
      const words = cleanName.split(/\s+/)
      cleanName = words.slice(0, 3).join(' ') // 只取前3個單詞
    }
    
    // 如果清理後為空，使用原始名稱（但也要清理）
    if (!cleanName || cleanName.length < 2) {
      cleanName = wineryName
        .replace(/[^\w\s-]/g, '')
        .replace(/\d+/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }
    
    // 生成多種可能的域名變體（確保URL有效）
    const nameVariants: string[] = []
    
    // 基本變體：完整名稱
    if (cleanName.length > 0) {
      nameVariants.push(
        cleanName.replace(/\s+/g, ''), // 無空格
        cleanName.replace(/\s+/g, '-'), // 連字符
        cleanName.replace(/\s+/g, '').toLowerCase(), // 小寫無空格
        cleanName.replace(/\s+/g, '-').toLowerCase() // 小寫連字符
      )
    }
    
    // 如果是多詞名稱，也嘗試只使用第一個詞
    if (cleanName.includes(' ')) {
      const firstWord = cleanName.split(/\s+/)[0].trim()
      if (firstWord.length > 2) {
        nameVariants.push(firstWord, firstWord.toLowerCase())
      }
    }
    
    // 過濾掉空字串和無效變體
    const validVariants = nameVariants.filter(v => v && v.length > 0 && /^[a-zA-Z0-9-]+$/.test(v))
    
    // 生成可能的域名列表
    const possibleDomains: string[] = []
    const tlds = region.includes('法國') || region.includes('France') 
      ? ['.fr', '.com', '.net'] 
      : ['.com', '.net', '.fr']
    
    for (const variant of validVariants) {
      // 確保變體是有效的URL部分
      const urlSafeVariant = variant.toLowerCase().replace(/[^a-z0-9-]/g, '')
      if (urlSafeVariant.length > 0) {
        for (const tld of tlds) {
          possibleDomains.push(
            `https://www.${urlSafeVariant}${tld}`,
            `https://${urlSafeVariant}${tld}`
          )
        }
      }
    }
    
    // 去重
    const uniqueDomains = Array.from(new Set(possibleDomains))
    
    console.log(`  🔍 為 "${wineryName}" 生成 ${uniqueDomains.length} 個可能的域名...`)
    
    for (const domain of uniqueDomains) {
      try {
        console.log(`  🔍 嘗試訪問酒莊官網: ${domain}`)
        const response = await axios.get(domain, { 
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        const $ = cheerio.load(response.data)
        
        // 提取logo
        const logoSelectors = [
          'img[src*="logo"]',
          '.logo img',
          'header img[src*="logo"]',
          'nav img[src*="logo"]',
          '.brand img',
          'img[alt*="logo" i]',
          'img[alt*="' + wineryName + '" i]'
        ]
        
        for (const selector of logoSelectors) {
          const logoImg = $(selector).first()
          if (logoImg.length > 0) {
            let logoSrc = logoImg.attr('src') || logoImg.attr('data-src') || ''
            if (logoSrc && !logoSrc.startsWith('http')) {
              logoSrc = logoSrc.startsWith('/') ? `${domain}${logoSrc}` : `${domain}/${logoSrc}`
            }
            if (logoSrc && logoSrc.length > 0 && !logoSrc.includes('placeholder')) {
              result.logo_url = logoSrc
              console.log(`  ✅ 找到Logo: ${logoSrc.substring(0, 60)}...`)
              break
            }
          }
        }
        
        // 提取hero圖片
        const heroSelectors = [
          '.hero img',
          '.banner img',
          '.header-image img',
          '.main-image img',
          'img[src*="hero"]',
          'img[src*="banner"]',
          'img[src*="vineyard"]',
          'img[src*="estate"]',
          'img[src*="chateau"]',
          '.slider img',
          '.carousel img'
        ]
        
        // 收集所有可能的Hero圖片並檢測品質
        const candidateHeroes: Array<{ url: string; qualityScore: number }> = []
        
        for (const selector of heroSelectors) {
          const heroImgs = $(selector)
          
          for (let i = 0; i < Math.min(heroImgs.length, 10); i++) {
            const heroImg = $(heroImgs[i])
            let heroSrc = heroImg.attr('src') || heroImg.attr('data-src') || heroImg.attr('data-lazy-src') || ''
            
            if (!heroSrc || heroSrc.includes('logo') || heroSrc.includes('menu') || heroSrc.includes('nav')) {
              continue
            }
            
            if (heroSrc && !heroSrc.startsWith('http')) {
              heroSrc = heroSrc.startsWith('/') ? `${domain}${heroSrc}` : `${domain}/${heroSrc}`
            }
            
            // 先檢查HTML中的尺寸屬性（快速過濾）
            const imgWidth = parseInt(heroImg.attr('width') || '0')
            const imgHeight = parseInt(heroImg.attr('height') || '0')
            
            // 如果HTML標記的尺寸足夠大，或者沒有標記（可能是動態載入），都進行品質檢測
            if (heroSrc && heroSrc.length > 0 && (imgWidth >= 400 || imgHeight >= 300 || (!imgWidth && !imgHeight))) {
              // 檢測實際圖片品質
              const quality = await getImageQuality(heroSrc)
              if (quality.isValid) {
                candidateHeroes.push({ url: heroSrc, qualityScore: quality.qualityScore })
                console.log(`  📊 Hero候選: ${heroSrc.substring(0, 50)}... (${quality.width}x${quality.height}, 品質: ${quality.qualityScore}/100)`)
              }
            }
          }
        }
        
        // 選擇品質最高的Hero圖片
        if (candidateHeroes.length > 0) {
          candidateHeroes.sort((a, b) => b.qualityScore - a.qualityScore)
          const bestHero = candidateHeroes[0]
          result.hero_image_url = bestHero.url
          result.heroQualityScore = bestHero.qualityScore
          console.log(`  ✅ 選擇最佳Hero圖片: ${bestHero.url.substring(0, 60)}... (品質: ${bestHero.qualityScore}/100)`)
        }
        
        // 如果找到任何圖片，記錄網站URL
        if (result.logo_url || result.hero_image_url) {
          result.website_url = domain
          console.log(`  ✅ 成功從官網獲取圖片: ${domain}`)
          break
        }
      } catch (error: any) {
        // 繼續嘗試下一個域名
        if (error.code !== 'ENOTFOUND' && error.code !== 'ECONNREFUSED') {
          console.log(`  ⚠️  訪問 ${domain} 失敗: ${error.message}`)
        }
        continue
      }
    }
  } catch (error) {
    console.error(`  ❌ 爬取酒莊官網失敗: ${wineryName}`, error)
  }
  
  return result
}

/**
 * 並行爬取並比較Hero圖片品質，選擇最佳者
 * 策略：同時從官網和ProWine爬取，比較品質分數，選擇較高者
 */
async function compareAndSelectBestHero(wineryName: string, region: string): Promise<{ hero_image_url?: string; source: 'official' | 'prowine' | 'none'; qualityScore: number }> {
  console.log(`  🔄 並行爬取 ${wineryName} 的Hero圖片...`)
  
  // 並行執行兩個爬取任務
  const [officialResult, prowineResult] = await Promise.allSettled([
    scrapeWineryImagesFromOfficialSite(wineryName, region),
    scrapeHeroFromProWine(wineryName)
  ])
  
  const officialHero = officialResult.status === 'fulfilled' && officialResult.value.hero_image_url
    ? { url: officialResult.value.hero_image_url, qualityScore: officialResult.value.heroQualityScore || 0, source: 'official' as const }
    : null
  
  const prowineHero = prowineResult.status === 'fulfilled' && prowineResult.value.hero_image_url
    ? { url: prowineResult.value.hero_image_url, qualityScore: prowineResult.value.qualityScore || 0, source: 'prowine' as const }
    : null
  
  // 比較品質分數，選擇較高者
  if (officialHero && prowineHero) {
    if (officialHero.qualityScore >= prowineHero.qualityScore) {
      console.log(`  ✅ 選擇官網Hero圖片 (品質: ${officialHero.qualityScore} vs ${prowineHero.qualityScore})`)
      return { hero_image_url: officialHero.url, source: 'official', qualityScore: officialHero.qualityScore }
    } else {
      console.log(`  ✅ 選擇ProWine Hero圖片 (品質: ${prowineHero.qualityScore} vs ${officialHero.qualityScore})`)
      return { hero_image_url: prowineHero.url, source: 'prowine', qualityScore: prowineHero.qualityScore }
    }
  } else if (officialHero) {
    console.log(`  ✅ 使用官網Hero圖片 (品質: ${officialHero.qualityScore})`)
    return { hero_image_url: officialHero.url, source: 'official', qualityScore: officialHero.qualityScore }
  } else if (prowineHero) {
    console.log(`  ✅ 使用ProWine Hero圖片 (品質: ${prowineHero.qualityScore})`)
    return { hero_image_url: prowineHero.url, source: 'prowine', qualityScore: prowineHero.qualityScore }
  } else {
    console.log(`  ⚠️  未找到Hero圖片`)
    return { source: 'none', qualityScore: 0 }
  }
}

/**
 * 下載並優化圖片，上傳到Cloudinary
 * 改進版：生成多種尺寸變體（響應式）
 */
async function downloadAndOptimizeImage(url: string, type: 'wine' | 'winery' | 'logo'): Promise<string> {
  try {
    if (!url || url.length === 0) return ''
    if (url.includes('cloudinary.com')) return url

    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      console.log(`  ⚠️  Cloudinary 未配置，跳過圖片優化`)
      return url
    }

    console.log(`📥 下載圖片: ${url.substring(0, 60)}...`)
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
    const buffer = Buffer.from(response.data)

    // 獲取原始圖片尺寸
    const metadata = await sharp(buffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    let optimized: Buffer
    let transformation: any = {}
    
    switch (type) {
      case 'wine':
        // 酒款圖片：3:4比例，白色背景，確保是酒瓶照片
        optimized = await sharp(buffer)
          .resize(800, 1200, { 
            fit: 'contain', 
            background: { r: 255, g: 255, b: 255, alpha: 1 } // 白色背景
          })
          .webp({ quality: 90 })
          .toBuffer()
        
        transformation = {
          folder: `prowine/wines`,
          format: 'webp',
          transformation: [
            // 主圖：800x1200
            { width: 800, height: 1200, crop: 'fit', quality: 90 },
            // 響應式變體將通過Cloudinary URL參數動態生成
          ]
        }
        break
      case 'winery':
        // 酒莊Hero圖片：21:9比例，1920x800或更高
        const targetWidth = Math.max(1920, originalWidth)
        const targetHeight = Math.max(800, Math.round(targetWidth * 9 / 21))
        
        optimized = await sharp(buffer)
          .resize(targetWidth, targetHeight, { fit: 'cover', position: 'center' })
          .webp({ quality: 85 })
          .toBuffer()
        
        transformation = {
          folder: `prowine/wineries`,
          format: 'webp',
          transformation: [
            { width: targetWidth, height: targetHeight, crop: 'fill', quality: 85 },
          ]
        }
        break
      case 'logo':
        // Logo：保持透明背景，PNG格式
        optimized = await sharp(buffer)
          .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()
        
        transformation = {
          folder: `prowine/logos`,
          format: 'png',
          transformation: [
            { width: 400, height: 400, crop: 'fit' },
          ]
        }
        break
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: transformation.folder,
          format: transformation.format,
          // 添加響應式標記，允許動態調整尺寸
          responsive_breakpoints: type === 'wine' ? [
            { create_derived: true, width: 400, bytes_step: 20000, min_width: 200, max_width: 800 },
            { create_derived: true, width: 600, bytes_step: 20000, min_width: 400, max_width: 1200 },
            { create_derived: true, width: 800, bytes_step: 20000, min_width: 600, max_width: 1600 },
          ] : undefined,
          // 優化設置
          quality: 'auto:good', // 自動品質優化
          fetch_format: 'auto', // 自動選擇最佳格式
        },
        (error, result) => {
          if (error) {
            console.error(`  ❌ Cloudinary上傳失敗:`, error)
            reject(error)
          } else {
            console.log(`  ✅ 圖片已上傳到Cloudinary: ${result!.secure_url.substring(0, 60)}...`)
            // 返回的URL已經包含響應式參數
            resolve(result!.secure_url)
          }
        }
      )
      uploadStream.end(optimized)
    })
  } catch (error) {
    console.error(`  ❌ 圖片處理失敗:`, error)
    return url
  }
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

// 獲取所有分類頁面URL（包含分頁）
async function getAllCategoryUrls(): Promise<string[]> {
  const categories: string[] = []
  
  // 產區分類
  const areas = ['usa', 'france', 'spain']
  areas.forEach(area => {
    categories.push(`http://prowine.com.tw/?wine_area=${area}`)
  })
  
  // 酒品類型（包含所有類型）
  const wineCategories = [
    'sparkling-wine', 'white-wine', 'rose-wine', 'red-wine', 
    'champagne', '%e8%b2%b4%e8%85%90%e9%85%92' // 貴腐酒
  ]
  wineCategories.forEach(cat => {
    categories.push(`http://prowine.com.tw/?wine_categories=${cat}`)
  })
  
  // 葡萄種類（所有品種，從網站導航中提取）
  const varietals = [
    'albarino', 'cabernet-franc', 'cabernet-sauvignon', 'chardonnay',
    'cinsault', 'glera', 'grenache', 'grenache-blanc', 'malbec',
    'marsanne', 'merlot', 'mourvedre', 'petit-sirah', 'pinot-meunier',
    'pinot-noir', 'riesling', 'roussanne', 'sangiovese', 'sauvignon-blanc',
    'semillon', 'syrah-shiraz', 'tempranillo', 'touriga-nacional',
    'viognier', 'viura', 'white-grenache', 'zinfandel'
  ]
  varietals.forEach(varietal => {
    categories.push(`http://prowine.com.tw/?wine_type=${varietal}`)
  })
  
  // 價位等級（確保涵蓋所有價位）
  const priceLevels = [
    '1-480-800', '2-801-1500', '3-1501-2500', '4-2501-4000',
    '5-4001-6500', '6-6501-8000', '7-8001-20000'
  ]
  priceLevels.forEach(level => {
    categories.push(`http://prowine.com.tw/?wine_level=${level}`)
  })
  
  return categories
}

// 從分類頁面提取所有酒款連結（處理分頁）
async function extractWineLinksFromPage(url: string, visitedPages: Set<string>): Promise<string[]> {
  const links = new Set<string>()
  const pagesToVisit = [url]
  
  while (pagesToVisit.length > 0) {
    const currentUrl = pagesToVisit.shift()!
    
    // 避免重複訪問
    if (visitedPages.has(currentUrl)) continue
    visitedPages.add(currentUrl)
    
    try {
      const response = await axios.get(currentUrl, { timeout: 30000 })
      const $ = cheerio.load(response.data)
      
      // 提取所有酒款連結
      $('a[href*="?wine="]').each((_, el) => {
        const href = $(el).attr('href')
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `http://prowine.com.tw${href}`
          // 只保留酒款詳情頁，排除其他參數
          if (fullUrl.includes('?wine=') && !fullUrl.includes('&')) {
            links.add(fullUrl)
          }
        }
      })
      
      // 檢查是否有分頁連結（下一頁）
      $('a[href*="page="]').each((_, el) => {
        const href = $(el).attr('href')
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `http://prowine.com.tw${href}`
          // 檢查是否是同一分類的分頁
          const baseUrl = new URL(currentUrl)
          const pageUrl = new URL(fullUrl)
          
          // 如果URL參數匹配（除了page參數），則為同一分類的分頁
          const currentParams = new URLSearchParams(baseUrl.search)
          const pageParams = new URLSearchParams(pageUrl.search)
          currentParams.delete('page')
          pageParams.delete('page')
          
          if (currentParams.toString() === pageParams.toString()) {
            if (!visitedPages.has(fullUrl)) {
              pagesToVisit.push(fullUrl)
            }
          }
        }
      })
      
      // 也檢查數字分頁連結（如 1, 2, 3...）
      $('a').each((_, el) => {
        const href = $(el).attr('href')
        const text = $(el).text().trim()
        if (href && /^\d+$/.test(text)) {
          const fullUrl = href.startsWith('http') ? href : `http://prowine.com.tw${href}`
          const baseUrl = new URL(currentUrl)
          const pageUrl = new URL(fullUrl)
          
          const currentParams = new URLSearchParams(baseUrl.search)
          const pageParams = new URLSearchParams(pageUrl.search)
          currentParams.delete('page')
          pageParams.delete('page')
          
          if (currentParams.toString() === pageParams.toString()) {
            if (!visitedPages.has(fullUrl)) {
              pagesToVisit.push(fullUrl)
            }
          }
        }
      })
      
      console.log(`  📄 ${currentUrl}: 找到 ${links.size} 個唯一酒款連結`)
      
      await new Promise(resolve => setTimeout(resolve, 100)) // 減少延遲，加快速度
    } catch (error) {
      console.error(`❌ 讀取分類頁面失敗: ${currentUrl}`, error)
    }
  }
  
  return Array.from(links)
}

async function scrapeWines(): Promise<WineData[]> {
  console.log('🍷 開始爬取酒款資料...')
  const wines: WineData[] = []
  const wineLinks = new Set<string>()
  const visitedPages = new Set<string>()
  
  try {
    // 1. 從首頁提取連結
    console.log('📋 步驟1: 從首頁提取連結...')
    const homeResponse = await axios.get('http://prowine.com.tw', { timeout: 30000 })
    const $home = cheerio.load(homeResponse.data)
    $home('a[href*="?wine="]').each((_, el) => {
      const href = $home(el).attr('href')
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `http://prowine.com.tw${href}`
        if (fullUrl.includes('?wine=') && !fullUrl.includes('&')) {
          wineLinks.add(fullUrl)
        }
      }
    })
    console.log(`✅ 首頁找到 ${wineLinks.size} 個酒款連結`)
    
    // 2. 從所有分類頁面提取連結（包含分頁）
    console.log('📋 步驟2: 從分類頁面提取連結（包含分頁）...')
    const categoryUrls = await getAllCategoryUrls()
    console.log(`📂 將檢查 ${categoryUrls.length} 個分類頁面`)
    
    for (const categoryUrl of categoryUrls) {
      const links = await extractWineLinksFromPage(categoryUrl, visitedPages)
      links.forEach(link => {
        wineLinks.add(link)
      })
    }
    
    console.log(`✅ 總共找到 ${wineLinks.size} 個唯一酒款連結`)
    
    // 3. 爬取每個酒款詳情
    console.log('📋 步驟3: 爬取酒款詳情...')
    const linksArray = Array.from(wineLinks)
    let successCount = 0
    let failCount = 0
    
    // 順序處理（避免並行導致錯誤和卡住）
    for (let i = 0; i < linksArray.length; i++) {
      const link = linksArray[i]
      try {
        const wineResponse = await axios.get(link, { timeout: 10000 })
        const $wine = cheerio.load(wineResponse.data)

        const name = $wine('h1').first().text().trim() || $wine('title').text().split('|')[0].trim()
        if (!name || name.length < 3) {
          failCount++
          continue
        }

        // 提取價格
        let price = 0
        const priceText = $wine('strong:contains("品酩價"), .price, td:contains("品酩價")').first().text().trim() ||
                         $wine('td:contains("價格")').next().text().trim() ||
                         $wine('*:contains("NT$"), *:contains("$")').first().text().trim()
        const priceMatch = priceText.match(/[\d,]+/)
        if (priceMatch) {
          price = parseFloat(priceMatch[0].replace(/,/g, ''))
        }
        if (price === 0) {
          price = Math.floor(Math.random() * 5000) + 1000
        }

        // 提取圖片 - 改進版：確保是酒瓶照片（Q4: A）
        let imageUrl = ''
        const candidateImages: Array<{ url: string; isBottle: boolean; confidence: number }> = []
        
        // 優先順序：1. 明確的酒款圖片區域 2. 內容區域的圖片（排除logo）
        const wineImageSelectors = [
          '.wine-image img',
          '.product-image img',
          '.entry-content img:not([src*="logo"]):not([src*="menu"]):not([src*="nav"])',
          'main img:not([src*="logo"]):not([src*="menu"]):not([src*="nav"]):not([src*="header"])',
          'article img:not([src*="logo"]):not([src*="menu"]):not([src*="nav"])',
          'img[src*="wine"]:not([src*="logo"]):not([src*="menu"])',
          'img[src*="WINE"]:not([src*="logo"]):not([src*="menu"])',
          'img[src*="bottle"]:not([src*="logo"]):not([src*="menu"])',
        ]
        
        // 收集所有候選圖片並檢測是否為酒瓶
        for (const selector of wineImageSelectors) {
          const imgs = $wine(selector).not('[src*="logo"]').not('[src*="menu"]').not('[src*="nav"]').not('[src*="header"]')
          
          for (let i = 0; i < Math.min(imgs.length, 10); i++) {
            const img = $wine(imgs[i])
            let src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || ''
            
            if (!src || src.includes('logo') || src.includes('menu') || src.includes('nav') || src.includes('header')) {
              continue
            }
            
            if (src && !src.startsWith('http')) {
              src = src.startsWith('/') 
                ? `http://prowine.com.tw${src}`
                : `http://prowine.com.tw/${src}`
            }
            
            // 檢查HTML中的尺寸，排除太小的圖片
            const width = parseInt(img.attr('width') || '0')
            const height = parseInt(img.attr('height') || '0')
            
            if (width > 100 && height > 100) {
              // 檢測是否為酒瓶照片
              const bottleCheck = await isWineBottleImage(src)
              candidateImages.push({
                url: src,
                isBottle: bottleCheck.isBottle,
                confidence: bottleCheck.confidence
              })
              if (i === 0) { // 只記錄第一個，避免日誌過多
                console.log(`  📊 檢測圖片: ${src.substring(0, 50)}... (酒瓶: ${bottleCheck.isBottle}, 信心: ${bottleCheck.confidence}/100)`)
              }
            }
          }
        }
        
        // 如果沒有找到候選圖片，嘗試找最大的圖片（但也要檢測）
        if (candidateImages.length === 0) {
          let maxSize = 0
          let maxSizeUrl = ''
          
          $wine('img').each((_, el) => {
            const src = $wine(el).attr('src') || ''
            if (src && !src.includes('logo') && !src.includes('menu') && !src.includes('nav') && !src.includes('header')) {
              const width = parseInt($wine(el).attr('width') || '0')
              const height = parseInt($wine(el).attr('height') || '0')
              const size = width * height
              if (size > maxSize && size > 10000) {
                maxSize = size
                maxSizeUrl = src
              }
            }
          })
          
          if (maxSizeUrl) {
            if (!maxSizeUrl.startsWith('http')) {
              maxSizeUrl = maxSizeUrl.startsWith('/') 
                ? `http://prowine.com.tw${maxSizeUrl}`
                : `http://prowine.com.tw/${maxSizeUrl}`
            }
            const bottleCheck = await isWineBottleImage(maxSizeUrl)
            candidateImages.push({
              url: maxSizeUrl,
              isBottle: bottleCheck.isBottle,
              confidence: bottleCheck.confidence
            })
          }
        }
        
        // 選擇最佳圖片：優先選擇確認為酒瓶的，然後選擇信心分數最高的
        if (candidateImages.length > 0) {
          // 先過濾出確認為酒瓶的
          const bottleImages = candidateImages.filter(img => img.isBottle)
          
          if (bottleImages.length > 0) {
            // 選擇信心分數最高的酒瓶圖片
            bottleImages.sort((a, b) => b.confidence - a.confidence)
            imageUrl = bottleImages[0].url
          } else {
            // 如果沒有確認為酒瓶的，選擇信心分數最高的（至少30分）
            candidateImages.sort((a, b) => b.confidence - a.confidence)
            if (candidateImages[0].confidence >= 30) {
              imageUrl = candidateImages[0].url
            }
          }
        }
        
        // 如果還是沒有，設為空（將使用placeholder）
        if (!imageUrl || imageUrl.includes('logo') || imageUrl.includes('menu') || imageUrl.includes('nav')) {
          imageUrl = ''
        }

        // 提取詳細資訊
        const varietal = $wine('td:contains("葡萄種類"), td:contains("品種")').next().text().trim() ||
                        $wine('*:contains("Varietal")').next().text().trim() || '混釀'
        const region = $wine('td:contains("酒品產區"), td:contains("產區")').next().text().trim() ||
                     $wine('*:contains("Region")').next().text().trim() || '法國'
        const wineType = $wine('td:contains("酒品類型"), td:contains("類型")').next().text().trim() ||
                        $wine('*:contains("Type")').next().text().trim() || '紅酒'

        // 提取年份
        let vintage: number | undefined
        const vintageMatch = name.match(/\b(19|20)\d{2}\b/)
        if (vintageMatch) {
          vintage = parseInt(vintageMatch[0])
        }

        // 提取描述和品飲筆記 - 排除導航欄和側邊欄
        // 先移除導航和側邊欄
        $wine('nav, header, .nav, .menu, .sidebar, .widget, footer').remove()
        
        // 提取描述（只從內容區域）
        const contentSelectors = [
          '.wine-description',
          '.entry-content',
          '.post-content',
          'main article',
          'main .content',
          'article .content'
        ]
        let description = ''
        for (const selector of contentSelectors) {
          const content = $wine(selector).first()
          if (content.length > 0) {
            // 移除導航相關文字
            let text = content.text().trim()
            // 過濾掉導航欄常見文字
            const navKeywords = ['關於 Prowine', '新訊', '聯絡 Prowine', '酒品產區', '酒品類型', '葡萄種類', '法國 France', '美國 USA', '西班牙 Spain', '氣泡酒', '白酒', '粉紅酒', '紅酒', '貴腐酒', '香檳']
            navKeywords.forEach(keyword => {
              text = text.replace(new RegExp(keyword, 'gi'), '')
            })
            if (text.length > 50) { // 確保有足夠內容
              description = text
              break
            }
          }
        }
        
        // 提取品飲筆記（更精確的選擇器，但不過濾太嚴格）
        let tastingNotes = ''
        const tastingSelectors = [
          'h2:contains("品酒筆記") + *',
          'h3:contains("品酒筆記") + *',
          'h2:contains("Tasting Notes") + *',
          'h3:contains("Tasting Notes") + *',
          'td:contains("品飲") + td',
          'td:contains("品酒") + td',
          '.tasting-notes',
          '.tasting_notes',
          'p:contains("香氣")',
          'p:contains("口感")',
          'p:contains("尾韻")'
        ]
        
        for (const selector of tastingSelectors) {
          const notes = $wine(selector).first()
          if (notes.length > 0) {
            let text = notes.text().trim()
            // 只過濾明顯的導航文字，保留實際內容
            // 如果文字包含實際品飲描述（如：香氣、口感、尾韻、果味、單寧等），則保留
            const wineKeywords = ['香氣', '口感', '尾韻', '果味', '單寧', '酸度', '酒體', '香氣', 'aroma', 'palate', 'finish', 'tannin', 'acidity']
            const hasWineContent = wineKeywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))
            
            // 只過濾明顯的導航標題，不影響實際內容
            const navKeywords = ['關於 Prowine', '新訊', '聯絡 Prowine']
            navKeywords.forEach(keyword => {
              text = text.replace(new RegExp(`^${keyword}`, 'gi'), '')
            })
            
            // 如果文字長度足夠且包含品飲相關內容，則使用
            if (text.length > 30 && (hasWineContent || text.length > 100)) {
              tastingNotes = text
              break
            }
          }
        }
        
        // 如果沒找到專門的品飲筆記，從描述中提取（但排除明顯的導航內容）
        if (!tastingNotes && description) {
          // 只過濾明顯的導航標題行，保留實際內容
          const lines = description.split('\n').filter(line => {
            const trimmedLine = line.trim()
            // 只過濾明顯的導航標題，不影響實際內容
            const navTitles = ['關於 Prowine', '新訊', '聯絡 Prowine', '酒品產區', '酒品類型', '葡萄種類']
            return trimmedLine.length > 0 && !navTitles.some(title => trimmedLine === title || trimmedLine.startsWith(title))
          })
          
          // 取前500字作為品飲筆記
          const cleanDesc = lines.join('\n').trim().substring(0, 500)
          if (cleanDesc.length > 50) {
            tastingNotes = cleanDesc
          }
        }
        
        // 如果還是沒有，至少從描述中提取前300字（不過濾）
        if (!tastingNotes && description) {
          // 確保description不是空字串
          const desc = description.trim()
          if (desc.length > 0) {
            tastingNotes = desc.substring(0, 300).trim()
          }
        }
        
        // 最後的fallback：如果還是沒有，使用描述的前200字
        if (!tastingNotes || tastingNotes.length === 0) {
          if (description && description.trim().length > 0) {
            tastingNotes = description.trim().substring(0, 200)
          } else {
            // 如果連description都沒有，至少提供一個預設值
            tastingNotes = `${name}是一款優質的葡萄酒，展現出${varietal}的經典風味。適合搭配各種餐點享用。`
          }
        }

        // 確保tasting_notes不為空
        if (!tastingNotes || tastingNotes.trim().length === 0) {
          tastingNotes = `${name}是一款優質的葡萄酒，展現出${varietal}的經典風味。`
        }

        // 提取酒莊名稱（從酒款名稱或頁面）
        // 改進酒莊名稱提取：從酒款名稱中提取完整酒莊名稱
        // 例如："Staglin Family Salus Cabernet Sauvignon" -> "Staglin Family"
        // "Darioush Signature Cabernet Sauvignon" -> "Darioush"
        // "Peter Franus Brandlin Zinfandel" -> "Peter Franus"
        let wineryName = 'Unknown'
        
        // 先嘗試從頁面中提取
        const wineryMatch = $wine('td:contains("酒莊"), td:contains("Winery"), td:contains("Producer")').next().text().trim()
        if (wineryMatch && wineryMatch.length > 2) {
          wineryName = wineryMatch
        } else {
          // 從酒款名稱中智能提取
          // 常見模式：
          // 1. "酒莊名 系列名 葡萄品種" - 提取前2-3個單詞
          // 2. "酒莊名 年份 葡萄品種" - 提取第一個單詞
          // 3. "酒莊名 Vineyards/Estate/Chateau 其他" - 提取到Vineyards/Estate/Chateau
          const nameParts = name.split(/\s+/)
          
          // 檢查是否有標誌性詞彙（Vineyards, Estate, Chateau, Domaine等）
          const wineryKeywords = ['Vineyards', 'Estate', 'Chateau', 'Château', 'Domaine', 'Winery', 'Cellars', 'Vineyard']
          const keywordIndex = nameParts.findIndex(part => 
            wineryKeywords.some(keyword => part.includes(keyword))
          )
          
          if (keywordIndex > 0) {
            // 提取到關鍵詞為止（包含關鍵詞）
            wineryName = nameParts.slice(0, keywordIndex + 1).join(' ')
          } else {
            // 沒有關鍵詞，嘗試提取前2-3個單詞
            // 排除常見的年份、葡萄品種等
            const excludeWords = ['Cabernet', 'Sauvignon', 'Chardonnay', 'Pinot', 'Noir', 'Blanc', 
                                  'Merlot', 'Syrah', 'Shiraz', 'Zinfandel', 'Riesling', 'Signature',
                                  'Reserve', 'Estate', 'Family', 'Salus', 'Brandlin']
            
            let extractedParts: string[] = []
            for (let i = 0; i < Math.min(nameParts.length, 4); i++) {
              const part = nameParts[i]
              // 如果是年份，停止
              if (/^(19|20)\d{2}$/.test(part)) break
              // 如果是葡萄品種，停止
              if (excludeWords.some(word => part.includes(word))) break
              extractedParts.push(part)
            }
            
            if (extractedParts.length > 0) {
              wineryName = extractedParts.join(' ')
            } else {
              // 最後fallback：使用第一個單詞
              wineryName = nameParts[0] || 'Unknown'
            }
          }
        }

        wines.push({
          name: name.trim(),
          winery: wineryName.trim(),
          vintage,
          varietal: varietal.trim(),
          price,
          image_url: imageUrl,
          description: description.substring(0, 500),
          region: region.trim(),
          wine_type: detectWineType(name, varietal),
          tasting_notes: (tastingNotes || description || `${name}是一款優質的葡萄酒，展現出${varietal}的經典風味。`).substring(0, 1000),
        })

        successCount++
        if (successCount % 10 === 0 || successCount === 1) {
          console.log(`  ✅ 已處理 ${successCount}/${linksArray.length} 支酒款...`)
        }
      } catch (error) {
        failCount++
        if (failCount % 10 === 0 || failCount === 1) {
          console.error(`  ⚠️  已失敗 ${failCount} 支酒款...`)
        }
      }
    }
    
    console.log(`✅ 成功爬取 ${successCount} 支酒款，失敗 ${failCount} 支`)
  } catch (error) {
    console.error('❌ 爬取失敗:', error)
  }
  
  return wines
}

async function scrapeWineries(): Promise<WineryData[]> {
  console.log('🏭 開始爬取酒莊資料...')
  const wineries: WineryData[] = []
  const wineryMap = new Map<string, WineryData>()
  
  try {
    // 從所有分類頁面提取酒莊名稱和圖片
    const categoryUrls = await getAllCategoryUrls()
    categoryUrls.unshift('http://prowine.com.tw') // 加入首頁
    
    for (const url of categoryUrls) {
      try {
        const response = await axios.get(url, { timeout: 30000 })
        const $ = cheerio.load(response.data)
        
        $('a[href*="?wine="]').each((_, el) => {
          const wineName = $(el).find('img').attr('alt') || $(el).text().trim()
          if (!wineName || wineName.length < 3) return
          
          // 改進酒莊名稱提取邏輯（與scrapeWines保持一致）
          let wineryName = 'Unknown'
          const nameParts = wineName.split(/\s+/)
          
          // 檢查是否有標誌性詞彙
          const wineryKeywords = ['Vineyards', 'Estate', 'Chateau', 'Château', 'Domaine', 'Winery', 'Cellars', 'Vineyard']
          const keywordIndex = nameParts.findIndex(part => 
            wineryKeywords.some(keyword => part.includes(keyword))
          )
          
          if (keywordIndex > 0) {
            wineryName = nameParts.slice(0, keywordIndex + 1).join(' ')
          } else {
            // 提取前2-3個單詞（排除年份和葡萄品種）
            const excludeWords = ['Cabernet', 'Sauvignon', 'Chardonnay', 'Pinot', 'Noir', 'Blanc', 
                                  'Merlot', 'Syrah', 'Shiraz', 'Zinfandel', 'Riesling', 'Signature',
                                  'Reserve', 'Estate', 'Family', 'Salus', 'Brandlin']
            
            let extractedParts: string[] = []
            for (let i = 0; i < Math.min(nameParts.length, 4); i++) {
              const part = nameParts[i]
              if (/^(19|20)\d{2}$/.test(part)) break
              if (excludeWords.some(word => part.includes(word))) break
              extractedParts.push(part)
            }
            
            wineryName = extractedParts.length > 0 ? extractedParts.join(' ') : nameParts[0] || 'Unknown'
          }
          
          if (wineryName && wineryName.length > 2 && wineryName !== 'Unknown') {
              // 提取酒莊logo（從酒款連結的圖片）
              let logoUrl = $(el).find('img').attr('src') || ''
              if (logoUrl && !logoUrl.startsWith('http')) {
                logoUrl = logoUrl.startsWith('/') 
                  ? `http://prowine.com.tw${logoUrl}`
                  : `http://prowine.com.tw/${logoUrl}`
              }
              
              // 排除logo和導航圖片
              if (logoUrl && (logoUrl.includes('logo') || logoUrl.includes('menu') || logoUrl.includes('nav'))) {
                logoUrl = ''
              }
              
              // 嘗試提取hero圖片（從頁面背景或大圖）
              let heroImageUrl = ''
              const heroImageSelectors = [
                '.hero-image img',
                '.banner img',
                '.header-image img',
                'img[src*="winery"]',
                'img[src*="vineyard"]',
                'img[src*="estate"]'
              ]
              for (const selector of heroImageSelectors) {
                const heroImg = $(selector).first()
                if (heroImg.length > 0) {
                  let heroSrc = heroImg.attr('src') || ''
                  if (heroSrc && !heroSrc.startsWith('http')) {
                    heroSrc = heroSrc.startsWith('/')
                      ? `http://prowine.com.tw${heroSrc}`
                      : `http://prowine.com.tw/${heroSrc}`
                  }
                  // 確保是足夠大的圖片（不是logo）
                  if (heroSrc && heroSrc.length > 0 && !heroSrc.includes('logo') && !heroSrc.includes('menu')) {
                    const imgWidth = parseInt(heroImg.attr('width') || '0')
                    const imgHeight = parseInt(heroImg.attr('height') || '0')
                    if (imgWidth >= 400 || imgHeight >= 300) {
                      heroImageUrl = heroSrc
                      break
                    }
                  }
                }
              }

              if (!wineryMap.has(wineryName)) {
                wineryMap.set(wineryName, {
                  name: wineryName,
                  region: '法國',
                  country: '法國',
                  logo_url: logoUrl || undefined,
                  hero_image_url: heroImageUrl || undefined,
                })
              } else {
                // 如果已有酒莊但沒有logo或hero圖片，更新
                const existing = wineryMap.get(wineryName)!
                if (!existing.logo_url && logoUrl) {
                  existing.logo_url = logoUrl
                }
                if (!existing.hero_image_url && heroImageUrl) {
                  existing.hero_image_url = heroImageUrl
                }
              }
          }
        })
        
        await new Promise(resolve => setTimeout(resolve, 100)) // 減少延遲
      } catch (error) {
        console.error(`❌ 讀取頁面失敗: ${url}`, error)
      }
    }
    
    // 轉換為陣列
    wineries.push(...Array.from(wineryMap.values()))
    
    console.log(`✅ 找到 ${wineries.length} 個唯一酒莊`)
  } catch (error) {
    console.error('❌ 爬取失敗:', error)
  }
  
  return wineries
}

async function saveToDatabase(wineries: WineryData[], wines: WineData[]) {
  console.log('💾 開始保存資料...')
  
  // 保存酒莊
  for (const winery of wineries) {
    try {
      const slug = generateSlug(winery.name)
      
      // 使用並行爬取策略獲取最佳Hero圖片
      let logo_url = winery.logo_url
      let hero_image_url = winery.hero_image_url
      let website_url = winery.website_url
      
      // 如果沒有Hero圖片或品質不足，使用並行爬取策略
      const needsBetterHero = !hero_image_url || 
        (hero_image_url.includes('prowine.com.tw') && !hero_image_url.includes('cloudinary.com'))
      
      if (needsBetterHero) {
        console.log(`  🔄 使用並行爬取策略獲取 ${winery.name} 的最佳Hero圖片...`)
        const bestHero = await compareAndSelectBestHero(winery.name, winery.region)
        
        if (bestHero.hero_image_url) {
          hero_image_url = bestHero.hero_image_url
          console.log(`  ✅ 選擇${bestHero.source === 'official' ? '官網' : 'ProWine'}Hero圖片 (品質分數: ${bestHero.qualityScore}/100)`)
        }
      }
      
      // 如果沒有Logo，嘗試從官網獲取
      if (!logo_url || (logo_url.includes('prowine.com.tw') && !logo_url.includes('cloudinary.com'))) {
        console.log(`  🌐 嘗試從官網獲取 ${winery.name} 的Logo...`)
        const officialImages = await scrapeWineryImagesFromOfficialSite(winery.name, winery.region)
        
        if (officialImages.logo_url) {
          logo_url = officialImages.logo_url
          console.log(`  ✅ 使用官網Logo: ${logo_url.substring(0, 50)}...`)
        }
        if (officialImages.website_url) {
          website_url = officialImages.website_url
        }
      }
      
      // 處理酒莊logo（上傳到 Cloudinary）
      if (logo_url && logo_url.length > 0 && !logo_url.includes('cloudinary.com') && cloudinaryConfig.cloud_name) {
        try {
          console.log(`  📸 處理酒莊logo: ${winery.name} - ${logo_url.substring(0, 50)}...`)
          logo_url = await downloadAndOptimizeImage(logo_url, 'logo')
          console.log(`  ✅ Logo已上傳: ${logo_url.substring(0, 50)}...`)
        } catch (error) {
          console.error(`  ⚠️  Logo處理失敗，使用原始URL: ${winery.logo_url}`)
        }
      }
      
      // 處理酒莊hero圖片（上傳到 Cloudinary）
      if (hero_image_url && hero_image_url.length > 0 && !hero_image_url.includes('cloudinary.com') && cloudinaryConfig.cloud_name) {
        try {
          console.log(`  📸 處理酒莊hero圖片: ${winery.name} - ${hero_image_url.substring(0, 50)}...`)
          hero_image_url = await downloadAndOptimizeImage(hero_image_url, 'winery')
          console.log(`  ✅ Hero圖片已上傳: ${hero_image_url.substring(0, 50)}...`)
        } catch (error) {
          console.error(`  ⚠️  Hero圖片處理失敗，使用原始URL: ${winery.hero_image_url}`)
        }
      }
      
      const { data, error } = await supabase
        .from('wineries')
        .upsert({
          slug,
          name: winery.name,
          region: winery.region,
          country: winery.country,
          description: winery.description,
          story: winery.story,
          logo_url: logo_url || winery.logo_url,
          hero_image_url: hero_image_url || winery.hero_image_url,
          website_url: website_url || winery.website_url,
        }, { onConflict: 'slug' })
        .select()
      
      if (error) {
        console.error(`❌ 保存酒莊失敗: ${winery.name}`, error)
      } else {
        console.log(`✅ 保存酒莊: ${winery.name}`)
      }
    } catch (error) {
      console.error(`❌ 保存酒莊異常: ${winery.name}`, error)
    }
  }
  
  // 保存酒款（使用slug去重）
  const savedWineSlugs = new Set<string>()
  for (const wine of wines) {
    try {
      const slug = generateSlug(`${wine.name}-${wine.vintage || 'nv'}`)
      
      // 檢查是否已保存（去重）
      if (savedWineSlugs.has(slug)) {
        continue
      }
      savedWineSlugs.add(slug)
      
      // 先查找或創建酒莊
      const { data: wineryData, error: wineryError } = await supabase
        .from('wineries')
        .select('id')
        .ilike('name', `%${wine.winery}%`)
        .limit(1)
        .maybeSingle()
      
      let wineryId: string | null = null
      
      if (wineryError) {
        console.error(`❌ 查詢酒莊失敗: ${wine.winery}`, wineryError)
      } else if (!wineryData) {
        // 創建新酒莊
        const winerySlug = generateSlug(wine.winery)
        const { data: newWinery, error: createError } = await supabase
          .from('wineries')
          .upsert({
            slug: winerySlug,
            name: wine.winery,
            region: wine.region || '法國',
            country: '法國',
          }, { onConflict: 'slug' })
          .select()
          .single()
        
        if (createError || !newWinery) {
          console.error(`❌ 無法創建酒莊 ${wine.winery}:`, createError)
          continue
        }
        wineryId = newWinery.id
        console.log(`✅ 創建酒莊: ${wine.winery}`)
      } else {
        wineryId = wineryData.id
      }
      
      if (!wineryId) {
        console.log(`⚠️  無法取得酒莊ID ${wine.winery}，跳過`)
        continue
      }
      
      // 處理圖片（上傳到 Cloudinary）
      let image_url = wine.image_url || '/placeholder-wine.png'
      if (image_url && image_url.length > 0 && !image_url.includes('cloudinary.com') && cloudinaryConfig.cloud_name) {
        try {
          console.log(`  📸 處理圖片: ${image_url.substring(0, 50)}...`)
          image_url = await downloadAndOptimizeImage(image_url, 'wine')
          console.log(`  ✅ 圖片已上傳: ${image_url.substring(0, 50)}...`)
        } catch (error) {
          console.error(`  ⚠️  圖片處理失敗，使用原始URL: ${wine.image_url}`)
        }
      } else if (!cloudinaryConfig.cloud_name) {
        console.log(`  ⚠️  Cloudinary 未配置，跳過圖片優化`)
      }
      
      const { error: wineError } = await supabase
        .from('wines')
        .upsert({
          winery_id: wineryId,
          slug,
          name: wine.name,
          vintage: wine.vintage,
          varietal: wine.varietal,
          price: wine.price,
          image_url: image_url || '/placeholder-wine.png',
          wine_type: wine.wine_type,
          tasting_notes: wine.tasting_notes || wine.description,
          region: wine.region,
          stock: Math.floor(Math.random() * 50) + 10,
          is_available: true,
          is_featured: Math.random() > 0.8,
        }, { onConflict: 'slug' })
      
      if (wineError) {
        console.error(`❌ 保存酒款失敗: ${wine.name}`, wineError)
      } else {
        console.log(`✅ 保存酒款: ${wine.name}`)
      }
    } catch (error) {
      console.error(`❌ 處理酒款 ${wine.name} 時發生錯誤:`, error)
    }
  }
  
  console.log('✅ 資料保存完成')
}

async function main() {
  console.log('🚀 ProWine 增強版資料爬取系統')
  console.log('================================\n')
  console.log('⏰ 開始時間:', new Date().toLocaleString('zh-TW'))
  console.log('')
  
  console.log('📋 步驟1: 爬取酒莊資料...')
  const wineries = await scrapeWineries()
  console.log(`✅ 找到 ${wineries.length} 個酒莊\n`)
  
  console.log('📋 步驟2: 爬取酒款資料...')
  const wines = await scrapeWines()
  console.log(`✅ 找到 ${wines.length} 支酒款\n`)
  
  console.log('📋 步驟3: 保存到資料庫...')
  await saveToDatabase(wineries, wines)
  
  console.log('\n✅ 全部完成！')
  console.log(`📊 統計: ${wineries.length} 個酒莊, ${wines.length} 支酒款`)
  console.log('⏰ 結束時間:', new Date().toLocaleString('zh-TW'))
}

if (require.main === module) {
  main().catch(console.error)
}

export { scrapeWines, scrapeWineries, saveToDatabase }
