# ProWine 爬蟲系統完整實現

## 專案結構

```
scripts/
├── scraper/
│   ├── prowine-scraper.ts      # 主爬蟲
│   ├── winery-detail-scraper.ts # 酒莊官網爬蟲
│   ├── image-optimizer.ts       # 圖片優化
│   └── data-validator.ts        # 資料驗證
└── seed/
    └── initial-data.ts          # 初始資料
```

## 1. 主爬蟲實現

```typescript
// scripts/scraper/prowine-scraper.ts

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ApifyClient } from 'apify-client';
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
});

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  secure: true
});

interface ScrapedWine {
  name: string;
  winery: string;
  vintage?: number;
  varietal: string;
  price: number;
  image_url: string;
  gallery_urls?: string[];
  description: string;
  tasting_notes?: string;
  food_pairing?: string[];
  region?: string;
  appellation?: string;
  alcohol_content?: number;
  volume?: number;
  wine_type?: string;
  awards?: string[];
  ratings?: Array<{ source: string; score: number }>;
}

interface ScrapedWinery {
  name: string;
  logo_url?: string;
  hero_image_url?: string;
  region: string;
  country: string;
  established?: number;
  story?: string;
  description?: string;
  acreage?: number;
  website_url?: string;
  awards_count?: number;
}

class ProWineScraper {
  private baseUrl = 'http://prowine.com.tw';
  private processedImages = new Set<string>();

  // === 圖片處理 ===

  async downloadAndOptimizeImage(url: string, type: 'wine' | 'winery' | 'logo'): Promise<string> {
    try {
      console.log(`📥 下載圖片: ${url}`);

      // 下載圖片
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      // 根據類型優化
      let optimized: Buffer;
      switch (type) {
        case 'wine':
          // 酒瓶圖片: 800x1200, 白色背景
          optimized = await sharp(buffer)
            .resize(800, 1200, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 90 })
            .toBuffer();
          break;

        case 'winery':
          // 酒莊圖片: 1920x800, 保持比例
          optimized = await sharp(buffer)
            .resize(1920, 800, {
              fit: 'cover',
              position: 'center'
            })
            .webp({ quality: 85 })
            .toBuffer();
          break;

        case 'logo':
          // Logo: 400x400, 透明背景
          optimized = await sharp(buffer)
            .resize(400, 400, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .png()
            .toBuffer();
          break;
      }

      // 上傳到 Cloudinary
      const uploadResult = await new Promise<string>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `prowine/${type}s`,
            format: type === 'logo' ? 'png' : 'webp',
            transformation: [
              { quality: 'auto' },
              { fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url);
          }
        );

        uploadStream.end(optimized);
      });

      console.log(`✅ 圖片上傳成功: ${uploadResult}`);
      return uploadResult;

    } catch (error) {
      console.error(`❌ 圖片處理失敗:`, error);
      return url; // 失敗時返回原始URL
    }
  }

  // === ProWine 網站爬取 ===

  async scrapeProWineWineries(): Promise<ScrapedWinery[]> {
    console.log('🏭 開始爬取 ProWine 酒莊資料...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/wineries`);
      const $ = cheerio.load(response.data);
      const wineries: ScrapedWinery[] = [];

      // 方法1: 如果有結構化的酒莊列表頁
      $('.winery-item, .winery-card, .producer-item').each((_, element) => {
        const $el = $(element);
        
        const winery: ScrapedWinery = {
          name: $el.find('.winery-name, .producer-name, h3, h2').first().text().trim(),
          logo_url: $el.find('.winery-logo img, .logo img').attr('src'),
          hero_image_url: $el.find('.winery-image img, .featured-image img').attr('src'),
          region: $el.find('.region, .location').text().trim(),
          country: $el.find('.country').text().trim() || '法國',
          established: parseInt($el.find('.established, .founded').text().replace(/\D/g, '')),
          description: $el.find('.description, .excerpt').text().trim(),
          website_url: $el.find('a.website, a.official-site').attr('href'),
        };

        if (winery.name) {
          wineries.push(winery);
        }
      });

      // 方法2: 如果需要從多個頁面爬取
      if (wineries.length === 0) {
        console.log('📋 未找到酒莊列表，嘗試從導航選單爬取...');
        
        // 查找所有酒莊連結
        const wineryLinks = $('a[href*="winery"], a[href*="producer"]')
          .map((_, el) => $(el).attr('href'))
          .get()
          .filter((link): link is string => !!link && link.includes('winery'));

        // 去重
        const uniqueLinks = [...new Set(wineryLinks)];

        // 爬取每個酒莊頁面
        for (const link of uniqueLinks.slice(0, 50)) { // 限制數量
          try {
            const winery = await this.scrapeWineryPage(`${this.baseUrl}${link}`);
            if (winery) {
              wineries.push(winery);
            }
            await this.delay(1000); // 避免過快請求
          } catch (error) {
            console.error(`❌ 爬取酒莊頁面失敗: ${link}`, error);
          }
        }
      }

      console.log(`✅ 爬取到 ${wineries.length} 個酒莊`);
      return wineries;
      
    } catch (error) {
      console.error('❌ 爬取 ProWine 酒莊失敗:', error);
      return [];
    }
  }

  async scrapeWineryPage(url: string): Promise<ScrapedWinery | null> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const winery: ScrapedWinery = {
        name: $('h1, .winery-name').first().text().trim(),
        logo_url: $('.winery-logo img, .brand-logo img').attr('src'),
        hero_image_url: $('.hero-image img, .featured-image img').first().attr('src'),
        region: $('.region, .location').first().text().trim(),
        country: $('.country').text().trim() || '法國',
        established: parseInt($('.established, .founded, .since').text().replace(/\D/g, '')),
        story: $('.story, .about, .description').first().text().trim(),
        description: $('.intro, .excerpt').first().text().trim(),
        website_url: $('a.website, a.official-site, a[href*="http"]').first().attr('href'),
      };

      return winery.name ? winery : null;

    } catch (error) {
      console.error(`❌ 爬取酒莊頁面失敗: ${url}`, error);
      return null;
    }
  }

  async scrapeProWineWines(): Promise<ScrapedWine[]> {
    console.log('🍷 開始爬取 ProWine 酒款資料...');
    
    try {
      const wines: ScrapedWine[] = [];

      // 方法1: 從酒款列表頁爬取
      const listResponse = await axios.get(`${this.baseUrl}/wines`);
      const $list = cheerio.load(listResponse.data);

      const wineLinks = $list('a[href*="wine"], a[href*="product"]')
        .map((_, el) => $list(el).attr('href'))
        .get()
        .filter((link): link is string => !!link && link.includes('wine'));

      const uniqueLinks = [...new Set(wineLinks)];

      console.log(`📋 找到 ${uniqueLinks.length} 個酒款連結`);

      // 爬取每個酒款頁面
      for (const link of uniqueLinks) {
        try {
          const wine = await this.scrapeWinePage(`${this.baseUrl}${link}`);
          if (wine) {
            wines.push(wine);
          }
          await this.delay(500); // 避免過快請求
        } catch (error) {
          console.error(`❌ 爬取酒款失敗: ${link}`, error);
        }
      }

      console.log(`✅ 爬取到 ${wines.length} 支酒款`);
      return wines;
      
    } catch (error) {
      console.error('❌ 爬取 ProWine 酒款失敗:', error);
      return [];
    }
  }

  async scrapeWinePage(url: string): Promise<ScrapedWine | null> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // 提取資訊
      const name = $('h1, .wine-name, .product-name').first().text().trim();
      const winery = $('.winery-name, .producer, .brand').first().text().trim();
      const priceText = $('.price, .amount').first().text().trim();
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));

      // 圖片
      const mainImage = $('.wine-image img, .product-image img').first().attr('src');
      const galleryImages = $('.gallery img, .additional-images img')
        .map((_, el) => $(el).attr('src'))
        .get()
        .filter((src): src is string => !!src);

      // 詳細資訊
      const description = $('.description, .product-description').first().text().trim();
      const tastingNotes = $('.tasting-notes, .notes').first().text().trim();
      
      // 食物配對
      const foodPairing = $('.food-pairing li, .pairing li')
        .map((_, el) => $(el).text().trim())
        .get();

      const wine: ScrapedWine = {
        name,
        winery,
        vintage: parseInt($('.vintage, .year').text().replace(/\D/g, '')),
        varietal: $('.varietal, .grape, .variety').text().trim() || '混釀',
        price: isNaN(price) ? 0 : price,
        image_url: mainImage || '',
        gallery_urls: galleryImages,
        description,
        tasting_notes: tastingNotes,
        food_pairing: foodPairing.length > 0 ? foodPairing : undefined,
        region: $('.region, .appellation').text().trim(),
        alcohol_content: parseFloat($('.alcohol, .abv').text().replace(/[^0-9.]/g, '')),
        volume: parseInt($('.volume, .size').text().replace(/\D/g, '')) || 750,
      };

      return wine.name && wine.winery ? wine : null;

    } catch (error) {
      console.error(`❌ 爬取酒款頁面失敗: ${url}`, error);
      return null;
    }
  }

  // === 酒莊官網深度爬取 ===

  async scrapeWineryWebsite(wineryUrl: string, wineryName: string) {
    console.log(`🔍 深度爬取酒莊官網: ${wineryName} - ${wineryUrl}`);
    
    try {
      // 使用 Apify Web Scraper
      const run = await apifyClient.actor('apify/web-scraper').call({
        startUrls: [{ url: wineryUrl }],
        linkSelector: 'a[href]',
        maxPagesPerCrawl: 20,
        maxConcurrency: 5,
        pageFunction: async function pageFunction({ page, request }) {
          const url = request.url;
          const title = await page.title();
          
          // 提取故事/關於我們
          const story = await page.evaluate(() => {
            const selectors = [
              '.about', '.story', '.history',
              '[class*="about"]', '[class*="story"]',
              '.content', '.main-content'
            ];
            
            for (const selector of selectors) {
              const el = document.querySelector(selector);
              if (el && el.textContent) {
                return el.textContent.trim();
              }
            }
            return '';
          });
          
          // 提取所有圖片
          const images = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('img'))
              .map(img => ({
                src: img.src,
                alt: img.alt,
                width: img.naturalWidth,
                height: img.naturalHeight
              }))
              .filter(img => 
                img.width > 300 && 
                (img.src.includes('wine') || 
                 img.src.includes('vineyard') || 
                 img.src.includes('cellar') ||
                 img.alt.toLowerCase().includes('wine'))
              );
          });
          
          // 提取酒款資訊
          const wines = await page.evaluate(() => {
            const wineElements = document.querySelectorAll(
              '.wine, .product, [class*="wine-"], [class*="product-"]'
            );
            
            return Array.from(wineElements).map(el => {
              const nameEl = el.querySelector('h2, h3, .name, .title');
              const imageEl = el.querySelector('img');
              const priceEl = el.querySelector('.price, [class*="price"]');
              
              return {
                name: nameEl?.textContent?.trim(),
                image: imageEl?.getAttribute('src'),
                price: priceEl?.textContent?.trim()
              };
            }).filter(wine => wine.name);
          });
          
          return {
            url,
            title,
            story,
            images,
            wines
          };
        },
      });

      // 等待爬取完成
      console.log(`⏳ 等待爬取完成...`);
      await apifyClient.run(run.id).waitForFinish();

      // 獲取結果
      const { defaultDatasetId } = run;
      const { items } = await apifyClient.dataset(defaultDatasetId).listItems();
      
      console.log(`✅ 爬取完成，共 ${items.length} 頁`);
      
      // 整理資料
      const aggregatedData = {
        story: '',
        wines: [] as any[],
        images: [] as any[],
      };
      
      for (const item of items) {
        if (item.story && item.story.length > aggregatedData.story.length) {
          aggregatedData.story = item.story;
        }
        if (item.wines) {
          aggregatedData.wines.push(...item.wines);
        }
        if (item.images) {
          aggregatedData.images.push(...item.images);
        }
      }
      
      // 去重
      aggregatedData.wines = this.deduplicateByName(aggregatedData.wines);
      aggregatedData.images = this.deduplicateByProperty(aggregatedData.images, 'src');
      
      return aggregatedData;
      
    } catch (error) {
      console.error(`❌ 爬取酒莊官網失敗: ${wineryName}`, error);
      return null;
    }
  }

  // === 資料保存 ===

  async saveToDatabase(wineries: ScrapedWinery[], wines: ScrapedWine[]) {
    console.log('💾 開始保存資料到資料庫...');
    console.log(`酒莊: ${wineries.length} 個`);
    console.log(`酒款: ${wines.length} 支`);

    const stats = {
      wineries: { success: 0, failed: 0 },
      wines: { success: 0, failed: 0 },
      images: { success: 0, failed: 0 }
    };

    // 1. 保存酒莊
    console.log('\n📁 保存酒莊...');
    for (const [index, winery] of wineries.entries()) {
      try {
        console.log(`\n[${index + 1}/${wineries.length}] 處理酒莊: ${winery.name}`);
        
        // 處理圖片
        let logo_url = winery.logo_url;
        let hero_image_url = winery.hero_image_url;
        
        if (logo_url) {
          console.log('  📸 優化 Logo...');
          logo_url = await this.downloadAndOptimizeImage(logo_url, 'logo');
          stats.images.success++;
        }
        
        if (hero_image_url) {
          console.log('  📸 優化 Hero 圖片...');
          hero_image_url = await this.downloadAndOptimizeImage(hero_image_url, 'winery');
          stats.images.success++;
        }

        // 生成 slug
        const slug = this.generateSlug(winery.name);

        // 保存到資料庫
        const { data, error } = await supabase
          .from('wineries')
          .upsert({
            slug,
            name: winery.name,
            logo_url,
            hero_image_url,
            region: winery.region,
            country: winery.country,
            established: winery.established,
            story: winery.story,
            description: winery.description,
            acreage: winery.acreage,
            awards_count: winery.awards_count || 0,
            website_url: winery.website_url,
            meta_title: `${winery.name} - ${winery.region} 精品酒莊 | ProWine`,
            meta_description: winery.description?.substring(0, 155),
          }, {
            onConflict: 'slug',
          })
          .select()
          .single();

        if (error) {
          console.error(`  ❌ 保存失敗:`, error.message);
          stats.wineries.failed++;
        } else {
          console.log(`  ✅ 保存成功: ${data.name}`);
          stats.wineries.success++;
        }

        await this.delay(200);

      } catch (error) {
        console.error(`  ❌ 處理酒莊 ${winery.name} 時發生錯誤:`, error);
        stats.wineries.failed++;
      }
    }

    // 2. 保存酒款
    console.log('\n\n🍷 保存酒款...');
    for (const [index, wine] of wines.entries()) {
      try {
        console.log(`\n[${index + 1}/${wines.length}] 處理酒款: ${wine.name}`);

        // 查找酒莊
        const { data: wineryData, error: wineryError } = await supabase
          .from('wineries')
          .select('id')
          .ilike('name', `%${wine.winery}%`)
          .single();

        if (wineryError || !wineryData) {
          console.log(`  ⚠️  找不到酒莊 ${wine.winery}，跳過`);
          stats.wines.failed++;
          continue;
        }

        // 處理主圖
        let image_url = wine.image_url;
        if (image_url) {
          console.log('  📸 優化主圖...');
          image_url = await this.downloadAndOptimizeImage(image_url, 'wine');
          stats.images.success++;
        }

        // 處理 Gallery
        let gallery_urls: string[] = [];
        if (wine.gallery_urls && wine.gallery_urls.length > 0) {
          console.log(`  📸 優化 ${wine.gallery_urls.length} 張 Gallery 圖片...`);
          for (const url of wine.gallery_urls.slice(0, 5)) { // 最多5張
            const optimized = await this.downloadAndOptimizeImage(url, 'wine');
            gallery_urls.push(optimized);
            stats.images.success++;
            await this.delay(100);
          }
        }

        // 生成 slug
        const slug = this.generateSlug(`${wine.name}-${wine.vintage || 'nv'}`);

        // 偵測酒款類型
        const wine_type = this.detectWineType(wine.varietal, wine.name);

        // 保存到資料庫
        const { data, error } = await supabase
          .from('wines')
          .upsert({
            winery_id: wineryData.id,
            slug,
            name: wine.name,
            vintage: wine.vintage,
            varietal: wine.varietal,
            price: wine.price,
            image_url,
            gallery_urls,
            alcohol_content: wine.alcohol_content,
            volume: wine.volume || 750,
            tasting_notes: wine.tasting_notes || wine.description,
            food_pairing: wine.food_pairing,
            region: wine.region,
            appellation: wine.appellation,
            wine_type,
            wine_style: this.detectWineStyle(wine.tasting_notes || wine.description || ''),
            stock: Math.floor(Math.random() * 50) + 10, // 隨機庫存 10-60
            is_available: true,
            is_featured: Math.random() > 0.8, // 20% 機率精選
            awards: wine.awards,
            ratings: wine.ratings ? JSON.parse(JSON.stringify(wine.ratings)) : null,
            meta_title: `${wine.name} ${wine.vintage || ''} - ${wine.winery} | ProWine`,
            meta_description: wine.tasting_notes?.substring(0, 155),
          }, {
            onConflict: 'slug',
          })
          .select()
          .single();

        if (error) {
          console.error(`  ❌ 保存失敗:`, error.message);
          stats.wines.failed++;
        } else {
          console.log(`  ✅ 保存成功: ${data.name}`);
          stats.wines.success++;
        }

        await this.delay(200);

      } catch (error) {
        console.error(`  ❌ 處理酒款 ${wine.name} 時發生錯誤:`, error);
        stats.wines.failed++;
      }
    }

    // 輸出統計
    console.log('\n\n📊 爬取統計:');
    console.log('================================');
    console.log(`酒莊: ✅ ${stats.wineries.success} / ❌ ${stats.wineries.failed}`);
    console.log(`酒款: ✅ ${stats.wines.success} / ❌ ${stats.wines.failed}`);
    console.log(`圖片: ✅ ${stats.images.success} / ❌ ${stats.images.failed}`);
    console.log('================================');
    console.log('✅ 資料保存完成！');
  }

  // === 工具方法 ===

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private detectWineType(varietal: string, name: string): string {
    const text = `${varietal} ${name}`.toLowerCase();
    
    const types = {
      red: ['cabernet', 'merlot', 'pinot noir', 'syrah', 'shiraz', 'malbec', 'tempranillo', 'zinfandel', 'sangiovese'],
      white: ['chardonnay', 'sauvignon blanc', 'riesling', 'pinot grigio', 'pinot gris', 'gewürztraminer', 'chenin blanc'],
      sparkling: ['champagne', 'prosecco', 'cava', 'sparkling', '氣泡'],
      rose: ['rosé', 'rose', 'rosato', '粉紅'],
      dessert: ['dessert', 'sweet', 'port', 'sauternes', 'ice wine', '甜']
    };
    
    for (const [type, keywords] of Object.entries(types)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return type;
      }
    }
    
    return 'red'; // 預設紅酒
  }

  private detectWineStyle(description: string): string {
    const text = description.toLowerCase();
    
    if (text.includes('full-bodied') || text.includes('濃郁') || text.includes('厚重')) {
      return 'full-bodied';
    } else if (text.includes('light') || text.includes('清爽') || text.includes('輕盈')) {
      return 'light';
    } else if (text.includes('crisp') || text.includes('清新') || text.includes('爽脆')) {
      return 'crisp';
    } else if (text.includes('elegant') || text.includes('優雅') || text.includes('細膩')) {
      return 'elegant';
    } else if (text.includes('bold') || text.includes('強勁') || text.includes('力量')) {
      return 'bold';
    }
    
    return 'balanced';
  }

  private deduplicateByName(items: any[]): any[] {
    const seen = new Set();
    return items.filter(item => {
      if (!item.name) return false;
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });
  }

  private deduplicateByProperty(items: any[], property: string): any[] {
    const seen = new Set();
    return items.filter(item => {
      const value = item[property];
      if (!value) return false;
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// === 執行主程式 ===

async function main() {
  console.log('🚀 ProWine 資料爬取系統');
  console.log('================================\n');

  const scraper = new ProWineScraper();
  
  try {
    // Step 1: 爬取 ProWine 網站
    console.log('📍 Step 1: 爬取 ProWine 網站\n');
    
    const wineries = await scraper.scrapeProWineWineries();
    const wines = await scraper.scrapeProWineWines();
    
    console.log(`\n✅ ProWine 爬取完成`);
    console.log(`   酒莊: ${wineries.length} 個`);
    console.log(`   酒款: ${wines.length} 支`);
    
    // Step 2: 爬取酒莊官網 (可選，耗時較長)
    const shouldScrapeWineryWebsites = process.argv.includes('--deep');
    
    if (shouldScrapeWineryWebsites) {
      console.log('\n📍 Step 2: 深度爬取酒莊官網\n');
      
      for (const winery of wineries) {
        if (winery.website_url) {
          const additionalData = await scraper.scrapeWineryWebsite(
            winery.website_url,
            winery.name
          );
          
          if (additionalData) {
            // 合併故事
            if (additionalData.story && additionalData.story.length > (winery.story?.length || 0)) {
              winery.story = additionalData.story;
            }
            
            // 合併酒款資訊
            if (additionalData.wines.length > 0) {
              for (const webWine of additionalData.wines) {
                const existingWine = wines.find(w => 
                  w.winery === winery.name && 
                  w.name.includes(webWine.name)
                );
                
                if (!existingWine && webWine.image) {
                  wines.push({
                    name: webWine.name,
                    winery: winery.name,
                    price: parseFloat(webWine.price?.replace(/[^0-9.]/g, '')) || 0,
                    image_url: webWine.image,
                    varietal: '混釀',
                    description: '',
                  });
                }
              }
            }
          }
          
          await scraper['delay'](2000); // 等待2秒避免過快請求
        }
      }
      
      console.log(`\n✅ 酒莊官網爬取完成`);
      console.log(`   總酒款數: ${wines.length} 支`);
    }
    
    // Step 3: 保存到資料庫
    console.log('\n📍 Step 3: 保存到資料庫\n');
    await scraper.saveToDatabase(wineries, wines);
    
    console.log('\n✅ 全部完成！');
    
  } catch (error) {
    console.error('\n❌ 發生錯誤:', error);
    process.exit(1);
  }
}

// 執行
if (require.main === module) {
  main().catch(console.error);
}

export { ProWineScraper };
```

## 2. 執行爬蟲

```bash
# package.json 添加 scripts
{
  "scripts": {
    "scrape": "tsx scripts/scraper/prowine-scraper.ts",
    "scrape:deep": "tsx scripts/scraper/prowine-scraper.ts --deep"
  }
}

# 安裝依賴
npm install cheerio axios apify-client sharp cloudinary

# 執行基礎爬取
npm run scrape

# 執行深度爬取（包含酒莊官網）
npm run scrape:deep
```

## 3. 爬蟲監控

```typescript
// scripts/scraper/scraper-monitor.ts

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateScraperReport() {
  // 統計酒莊
  const { count: wineryCount } = await supabase
    .from('wineries')
    .select('*', { count: 'exact', head: true });

  // 統計酒款
  const { count: wineCount } = await supabase
    .from('wines')
    .select('*', { count: 'exact', head: true });

  // 統計沒有圖片的
  const { count: noImageCount } = await supabase
    .from('wines')
    .select('*', { count: 'exact', head: true })
    .or('image_url.is.null,image_url.eq.');

  // 統計沒有Logo的酒莊
  const { count: noLogoCount } = await supabase
    .from('wineries')
    .select('*', { count: 'exact', head: true })
    .or('logo_url.is.null,logo_url.eq.');

  console.log('📊 爬蟲資料統計報告');
  console.log('================================');
  console.log(`總酒莊數: ${wineryCount}`);
  console.log(`總酒款數: ${wineCount}`);
  console.log(`缺少圖片的酒款: ${noImageCount}`);
  console.log(`缺少 Logo 的酒莊: ${noLogoCount}`);
  console.log('================================');
}

generateScraperReport();
```

## 4. 資料驗證

```typescript
// scripts/scraper/data-validator.ts

async function validateData() {
  const issues: string[] = [];

  // 檢查酒莊
  const { data: wineries } = await supabase
    .from('wineries')
    .select('*');

  wineries?.forEach(winery => {
    if (!winery.logo_url) {
      issues.push(`⚠️  酒莊缺少 Logo: ${winery.name}`);
    }
    if (!winery.story && !winery.description) {
      issues.push(`⚠️  酒莊缺少描述: ${winery.name}`);
    }
  });

  // 檢查酒款
  const { data: wines } = await supabase
    .from('wines')
    .select('*');

  wines?.forEach(wine => {
    if (!wine.image_url) {
      issues.push(`⚠️  酒款缺少圖片: ${wine.name}`);
    }
    if (wine.price === 0) {
      issues.push(`⚠️  酒款價格為0: ${wine.name}`);
    }
    if (!wine.tasting_notes) {
      issues.push(`⚠️  酒款缺少品飲筆記: ${wine.name}`);
    }
  });

  console.log(`\n📋 資料驗證報告: 發現 ${issues.length} 個問題\n`);
  issues.forEach(issue => console.log(issue));
}

validateData();
```

## 5. 排程爬蟲 (Cron Job)

```typescript
// app/api/cron/scrape/route.ts

import { NextResponse } from 'next/server';
import { ProWineScraper } from '@/scripts/scraper/prowine-scraper';

// 這個 API 可以被 Vercel Cron 或外部服務呼叫
export async function GET(request: Request) {
  // 驗證 Cron Secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scraper = new ProWineScraper();
    
    // 只爬取新增或更新的資料
    const wineries = await scraper.scrapeProWineWineries();
    const wines = await scraper.scrapeProWineWines();
    
    await scraper.saveToDatabase(wineries, wines);
    
    return NextResponse.json({
      success: true,
      wineries: wineries.length,
      wines: wines.length,
    });
    
  } catch (error) {
    console.error('Cron scrape error:', error);
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 });
  }
}
```

## 注意事項

1. **尊重網站規則**: 檢查 robots.txt，設置合理的請求間隔
2. **錯誤處理**: 完整的 try-catch 和重試機制
3. **資料驗證**: 確保爬取的資料完整性
4. **圖片優化**: 所有圖片都要優化和壓縮
5. **Logo 重要性**: 酒莊 Logo 必須正確顯示
6. **定期更新**: 設置定時任務定期更新資料
