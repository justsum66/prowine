# ProWine CURSOR 開發步驟完整指南
## 12週從零到羅浮宮級別電商平台

> **重要提醒**: 每個步驟都要先閱讀相關的SKILL.md，然後嚴格遵循設計規範
> **質量標準**: 每個組件都必須達到可獲獎水準，否則重做

---

## 🎯 專案總覽

### 技術堆疊
```typescript
Frontend:
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + Framer Motion
- Zustand (狀態管理)
- React Hook Form + Zod

Backend:
- Supabase (PostgreSQL + Auth + Storage)
- Prisma ORM
- Next.js API Routes

AI Services:
- Groq (免費AI聊天)
- Google AI Studio (備用)
- OpenRouter (進階功能)

Other Services:
- Resend (Email)
- Apify (爬蟲)
- Cloudinary (圖片CDN)

Social Integration:
- LINE@ (@415znht)
- Facebook (100064003571961)
- Instagram (@prowine2010)
```

### 專案結構
```
prowine/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # 認證相關頁面
│   ├── (main)/            # 主要頁面
│   ├── (admin)/           # 管理後台
│   ├── api/               # API Routes
│   └── layout.tsx         # Root Layout
├── components/            # React 組件
│   ├── ui/               # 基礎 UI 組件
│   ├── cards/            # Wine/Winery Cards
│   ├── ai/               # AI 聊天組件
│   └── layouts/          # 版面組件
├── lib/                  # 工具函數
│   ├── ai/              # AI 整合
│   ├── supabase/        # Supabase 客戶端
│   └── utils/           # 通用工具
├── scripts/             # 腳本
│   ├── scraper/         # 爬蟲腳本
│   └── seed/            # 資料庫種子
├── types/               # TypeScript 類型
├── styles/              # 全域樣式
└── public/              # 靜態資源
```

---

## 📅 Week 1: 專案初始化 + 設計系統

### Day 1: 專案建立與配置

#### Step 1.1: 建立 Next.js 專案

```bash
# CURSOR 指令
請執行以下命令建立 Next.js 14 專案：

npx create-next-app@latest prowine --typescript --tailwind --app --src-dir=false --import-alias="@/*"

cd prowine

# 安裝必要依賴
npm install framer-motion lucide-react zustand
npm install @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod
npm install date-fns clsx tailwind-merge
npm install @tanstack/react-query
npm install sharp

# 開發依賴
npm install -D @types/node prettier eslint-config-prettier
npm install -D @tailwindcss/typography @tailwindcss/forms
```

#### Step 1.2: 配置環境變數

```bash
# CURSOR 指令
請建立 .env.local 文件，內容如下：

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ohchipfmenenezlnnrjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjIwNDYsImV4cCI6MjA3OTczODA0Nn0.mLY3jKvhK27H9ORHejLgt86MkUj8DsdEWal__T05rzY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2MjA0NiwiZXhwIjoyMDc5NzM4MDQ2fQ.mZFS2IWPRb3BRzx5N2U0YxuBVtZ8XDrW1m_StZkeing

# AI Services (使用免費API)
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_AI_API_KEY=AIzaSyAsAV6tq0XbMjB7Ud8UPVYOC4_ZKb4-Wz4
OPENROUTER_API_KEY=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

# Email
RESEND_API_KEY=re_iB9nFtbr_NuW5GE1UgmANEZUwGeEK23We

# Apify (爬蟲)
APIFY_API_TOKEN=your_apify_api_token_here

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=341388744959128
CLOUDINARY_API_KEY=WBzabsfAJFZ9rHhuk0RDSQlifwU

# Social Media
NEXT_PUBLIC_LINE_ID=@415znht
NEXT_PUBLIC_FACEBOOK_PAGE_ID=100064003571961
NEXT_PUBLIC_INSTAGRAM_HANDLE=prowine2010

# App Config
NEXT_PUBLIC_APP_URL=https://prowine.com.tw
NEXT_PUBLIC_APP_NAME=ProWine
```

#### Step 1.3: 配置 Tailwind CSS

```bash
# CURSOR 指令
請更新 tailwind.config.ts，使用以下配置：

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#1A1A1A',
        'primary-gold': '#B8860B',
        'primary-burgundy': '#722F37',
        'primary-cream': '#F5F1E8',
        'accent-copper': '#B87333',
        'accent-sage': '#8B9A7E',
        'accent-plum': '#5D3A5A',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'serif'],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.5' }],
        'sm': ['14px', { lineHeight: '1.6' }],
        'base': ['16px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['30px', { lineHeight: '1.3' }],
        '4xl': ['36px', { lineHeight: '1.2' }],
        '5xl': ['48px', { lineHeight: '1.2' }],
        '6xl': ['60px', { lineHeight: '1.1' }],
        '7xl': ['72px', { lineHeight: '1.1' }],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'scale-in': 'scaleIn 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};

export default config;
```

#### Step 1.4: 設置字體

```bash
# CURSOR 指令
請更新 app/layout.tsx，加入 Google Fonts：

import { Inter, Playfair_Display, Cormorant_Garamond } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### Day 2: Supabase 資料庫設計

#### Step 2.1: 建立資料庫 Schema

```bash
# CURSOR 指令
請在 Supabase SQL Editor 執行以下 SQL：

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wineries Table (酒莊)
CREATE TABLE wineries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  established INTEGER,
  story TEXT,
  description TEXT,
  acreage DECIMAL,
  awards_count INTEGER DEFAULT 0,
  website_url TEXT,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wines Table (酒款)
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winery_id UUID REFERENCES wineries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  vintage INTEGER,
  varietal TEXT NOT NULL,
  price DECIMAL NOT NULL,
  original_price DECIMAL,
  
  -- Images
  image_url TEXT NOT NULL,
  gallery_urls TEXT[],
  
  -- Wine Details
  alcohol_content DECIMAL,
  volume INTEGER DEFAULT 750, -- ml
  tasting_notes TEXT,
  food_pairing TEXT[],
  serving_temperature TEXT,
  aging_potential TEXT,
  
  -- Classification
  wine_type TEXT NOT NULL, -- red, white, sparkling, rose, dessert
  wine_style TEXT, -- full-bodied, light, crisp, etc.
  region TEXT,
  appellation TEXT,
  
  -- Stock & Status
  stock INTEGER DEFAULT 0,
  is_limited BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  
  -- Awards
  awards TEXT[],
  ratings JSONB, -- {source: "Wine Spectator", score: 92}
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (會員)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Membership
  tier TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL DEFAULT 0,
  
  -- Preferences
  taste_profile JSONB,
  favorite_varietals TEXT[],
  preferred_price_range JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders Table (訂單)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  order_number TEXT UNIQUE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled
  payment_status TEXT NOT NULL DEFAULT 'pending',
  
  -- Amounts
  subtotal DECIMAL NOT NULL,
  discount DECIMAL DEFAULT 0,
  shipping_fee DECIMAL DEFAULT 0,
  total DECIMAL NOT NULL,
  
  -- Shipping
  shipping_address JSONB NOT NULL,
  shipping_method TEXT,
  tracking_number TEXT,
  
  -- Notes
  customer_note TEXT,
  admin_note TEXT,
  
  -- Timestamps
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items Table (訂單明細)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id),
  
  quantity INTEGER NOT NULL,
  unit_price DECIMAL NOT NULL,
  subtotal DECIMAL NOT NULL,
  
  -- Snapshot (保存購買時的酒款資訊)
  wine_snapshot JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wishlist Table (願望清單)
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, wine_id)
);

-- Reviews Table (評價)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wine_id UUID REFERENCES wines(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT NOT NULL,
  
  -- Moderation
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons Table (優惠券)
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  
  -- Discount
  discount_type TEXT NOT NULL, -- percentage, fixed
  discount_value DECIMAL NOT NULL,
  
  -- Conditions
  min_purchase DECIMAL,
  max_discount DECIMAL,
  applicable_to TEXT, -- all, specific_wines, specific_wineries
  applicable_ids UUID[],
  
  -- Limits
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts Table (部落格)
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  
  author_id UUID REFERENCES users(id),
  
  -- Categories & Tags
  category TEXT,
  tags TEXT[],
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft', -- draft, published
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat History Table (AI聊天記錄)
CREATE TABLE ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  
  messages JSONB NOT NULL,
  recommendations JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_wines_winery_id ON wines(winery_id);
CREATE INDEX idx_wines_slug ON wines(slug);
CREATE INDEX idx_wines_price ON wines(price);
CREATE INDEX idx_wines_wine_type ON wines(wine_type);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_reviews_wine_id ON reviews(wine_id);
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wineries_updated_at BEFORE UPDATE ON wineries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wines_updated_at BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Step 2.2: 設置 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE wineries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Wineries & Wines - Public Read
CREATE POLICY "Wineries are viewable by everyone"
  ON wineries FOR SELECT
  USING (true);

CREATE POLICY "Wines are viewable by everyone"
  ON wines FOR SELECT
  USING (true);

-- Users - Own Data Only
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Orders - Own Orders Only
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Wishlists - Own Wishlist Only
CREATE POLICY "Users can manage own wishlist"
  ON wishlists FOR ALL
  USING (auth.uid() = user_id);

-- Reviews - Own Reviews
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);
```

### Day 3: 爬蟲系統建立

#### Step 3.1: 建立爬蟲腳本

```bash
# CURSOR 指令
請建立 scripts/scraper/prowine-scraper.ts：

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ApifyClient } from 'apify-client';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN!,
});

interface ScrapedWine {
  name: string;
  winery: string;
  vintage?: number;
  varietal: string;
  price: number;
  image_url: string;
  description: string;
  tasting_notes?: string;
  region?: string;
  alcohol_content?: number;
}

interface ScrapedWinery {
  name: string;
  logo_url?: string;
  hero_image_url?: string;
  region: string;
  country: string;
  established?: number;
  story?: string;
  website_url?: string;
}

class ProWineScraper {
  private baseUrl = 'http://prowine.com.tw';

  async scrapeWineries(): Promise<ScrapedWinery[]> {
    console.log('🏭 開始爬取酒莊資料...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/wineries`);
      const $ = cheerio.load(response.data);
      const wineries: ScrapedWinery[] = [];

      $('.winery-item').each((_, element) => {
        const $el = $(element);
        
        const winery: ScrapedWinery = {
          name: $el.find('.winery-name').text().trim(),
          logo_url: $el.find('.winery-logo img').attr('src'),
          hero_image_url: $el.find('.winery-hero img').attr('src'),
          region: $el.find('.winery-region').text().trim(),
          country: $el.find('.winery-country').text().trim(),
          established: parseInt($el.find('.winery-established').text()),
          story: $el.find('.winery-story').text().trim(),
          website_url: $el.find('.winery-website').attr('href'),
        };

        wineries.push(winery);
      });

      console.log(`✅ 爬取到 ${wineries.length} 個酒莊`);
      return wineries;
      
    } catch (error) {
      console.error('❌ 爬取酒莊失敗:', error);
      return [];
    }
  }

  async scrapeWines(): Promise<ScrapedWine[]> {
    console.log('🍷 開始爬取酒款資料...');
    
    try {
      const response = await axios.get(`${this.baseUrl}/wines`);
      const $ = cheerio.load(response.data);
      const wines: ScrapedWine[] = [];

      $('.wine-item').each((_, element) => {
        const $el = $(element);
        
        const wine: ScrapedWine = {
          name: $el.find('.wine-name').text().trim(),
          winery: $el.find('.wine-winery').text().trim(),
          vintage: parseInt($el.find('.wine-vintage').text()),
          varietal: $el.find('.wine-varietal').text().trim(),
          price: parseFloat($el.find('.wine-price').text().replace(/[^0-9.]/g, '')),
          image_url: $el.find('.wine-image img').attr('src') || '',
          description: $el.find('.wine-description').text().trim(),
          tasting_notes: $el.find('.wine-tasting-notes').text().trim(),
          region: $el.find('.wine-region').text().trim(),
          alcohol_content: parseFloat($el.find('.wine-alcohol').text()),
        };

        wines.push(wine);
      });

      console.log(`✅ 爬取到 ${wines.length} 支酒款`);
      return wines;
      
    } catch (error) {
      console.error('❌ 爬取酒款失敗:', error);
      return [];
    }
  }

  async scrapeWineryWebsite(wineryUrl: string) {
    console.log(`🔍 爬取酒莊官網: ${wineryUrl}`);
    
    try {
      // 使用 Apify 進行深度爬取
      const run = await apifyClient.actor('apify/web-scraper').call({
        startUrls: [{ url: wineryUrl }],
        maxPagesPerCrawl: 10,
        pageFunction: `
          async function pageFunction(context) {
            const { page, request } = context;
            
            return {
              url: request.url,
              title: await page.title(),
              story: await page.$eval('.about-section', el => el.textContent),
              wines: await page.$$eval('.wine-item', els => 
                els.map(el => ({
                  name: el.querySelector('.wine-name')?.textContent,
                  image: el.querySelector('img')?.src
                }))
              ),
              images: await page.$$eval('img', imgs => 
                imgs.map(img => img.src).filter(src => src.includes('wine') || src.includes('vineyard'))
              )
            };
          }
        `,
      });

      const { defaultDatasetId } = run;
      const { items } = await apifyClient.dataset(defaultDatasetId).listItems();
      
      return items;
      
    } catch (error) {
      console.error(`❌ 爬取酒莊官網失敗:`, error);
      return [];
    }
  }

  async uploadToCloudinary(imageUrl: string): Promise<string> {
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = 'prowine_unsigned'; // 需要在Cloudinary設置

      const formData = new FormData();
      formData.append('file', imageUrl);
      formData.append('upload_preset', uploadPreset);

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      return response.data.secure_url;
    } catch (error) {
      console.error('❌ 上傳圖片到 Cloudinary 失敗:', error);
      return imageUrl; // 返回原始URL
    }
  }

  async saveToDatabase(wineries: ScrapedWinery[], wines: ScrapedWine[]) {
    console.log('💾 保存資料到資料庫...');

    // 1. 保存酒莊
    for (const winery of wineries) {
      const slug = winery.name.toLowerCase().replace(/\s+/g, '-');
      
      // 上傳圖片到 Cloudinary
      const logo_url = winery.logo_url 
        ? await this.uploadToCloudinary(winery.logo_url)
        : null;
      const hero_image_url = winery.hero_image_url
        ? await this.uploadToCloudinary(winery.hero_image_url)
        : null;

      const { data, error } = await supabase
        .from('wineries')
        .upsert({
          slug,
          ...winery,
          logo_url,
          hero_image_url,
        }, {
          onConflict: 'slug',
        });

      if (error) {
        console.error(`❌ 保存酒莊 ${winery.name} 失敗:`, error);
      } else {
        console.log(`✅ 保存酒莊 ${winery.name}`);
      }
    }

    // 2. 保存酒款
    for (const wine of wines) {
      // 找到對應的酒莊
      const { data: wineryData } = await supabase
        .from('wineries')
        .select('id')
        .eq('name', wine.winery)
        .single();

      if (!wineryData) {
        console.log(`⚠️  找不到酒莊 ${wine.winery}，跳過酒款 ${wine.name}`);
        continue;
      }

      const slug = `${wine.name}-${wine.vintage || 'nv'}`.toLowerCase().replace(/\s+/g, '-');
      
      // 上傳圖片到 Cloudinary
      const image_url = await this.uploadToCloudinary(wine.image_url);

      const { error } = await supabase
        .from('wines')
        .upsert({
          winery_id: wineryData.id,
          slug,
          name: wine.name,
          vintage: wine.vintage,
          varietal: wine.varietal,
          price: wine.price,
          image_url,
          tasting_notes: wine.tasting_notes || wine.description,
          alcohol_content: wine.alcohol_content,
          region: wine.region,
          wine_type: this.detectWineType(wine.varietal),
          stock: 100, // 預設庫存
          is_available: true,
        }, {
          onConflict: 'slug',
        });

      if (error) {
        console.error(`❌ 保存酒款 ${wine.name} 失敗:`, error);
      } else {
        console.log(`✅ 保存酒款 ${wine.name}`);
      }
    }

    console.log('✅ 資料保存完成！');
  }

  private detectWineType(varietal: string): string {
    const redVarietals = ['Cabernet', 'Merlot', 'Pinot Noir', 'Syrah', 'Shiraz', 'Malbec'];
    const whiteVarietals = ['Chardonnay', 'Sauvignon Blanc', 'Riesling', 'Pinot Grigio'];
    
    varietal = varietal.toLowerCase();
    
    if (redVarietals.some(v => varietal.includes(v.toLowerCase()))) {
      return 'red';
    } else if (whiteVarietals.some(v => varietal.includes(v.toLowerCase()))) {
      return 'white';
    } else if (varietal.includes('sparkling') || varietal.includes('champagne')) {
      return 'sparkling';
    } else if (varietal.includes('rose') || varietal.includes('rosé')) {
      return 'rose';
    }
    
    return 'red'; // 預設紅酒
  }
}

// 執行爬蟲
async function main() {
  const scraper = new ProWineScraper();
  
  console.log('🚀 開始 ProWine 資料爬取...');
  console.log('================================');
  
  // 1. 爬取酒莊
  const wineries = await scraper.scrapeWineries();
  
  // 2. 爬取酒款
  const wines = await scraper.scrapeWines();
  
  // 3. 爬取酒莊官網 (可選)
  for (const winery of wineries) {
    if (winery.website_url) {
      const additionalData = await scraper.scrapeWineryWebsite(winery.website_url);
      // 合併額外資料
      if (additionalData.length > 0) {
        winery.story = additionalData[0].story || winery.story;
      }
    }
  }
  
  // 4. 保存到資料庫
  await scraper.saveToDatabase(wineries, wines);
  
  console.log('================================');
  console.log('✅ 爬取完成！');
  console.log(`總共: ${wineries.length} 個酒莊, ${wines.length} 支酒款`);
}

main().catch(console.error);
```

#### Step 3.2: 執行爬蟲

```bash
# CURSOR 指令
請建立 package.json script 並執行：

"scripts": {
  "scrape": "ts-node --project tsconfig.scripts.json scripts/scraper/prowine-scraper.ts"
}

# 執行爬蟲
npm run scrape
```

### Day 4-5: 設計系統實作

#### Step 4.1: 建立基礎 UI 組件

```bash
# CURSOR 指令
請參考 ProWine_Card_Components完整實現.md，建立以下組件：

1. components/ui/Button.tsx
2. components/ui/Input.tsx
3. components/ui/Card.tsx
4. components/ui/Badge.tsx
5. components/ui/Modal.tsx

每個組件都要：
- TypeScript 嚴格類型
- 完整的 variants 支援
- 無障礙設計 (ARIA)
- 動畫效果 (Framer Motion)
- 響應式設計
```

#### Step 4.2: 建立 Wine Card

```bash
# CURSOR 指令
請根據 ProWine_Card_Components完整實現.md 的 Wine Card 部分，
建立 components/cards/WineCard.tsx

要求：
1. 完全遵循設計規範
2. 3:4 比例
3. Hover 效果：放大 1.05倍 + 金色邊框
4. 願望清單功能
5. 加入購物車功能
6. 庫存警告
7. 得獎標籤
8. 限量標籤
9. 響應式設計

測試：
- 在 Storybook 中測試所有狀態
- 確保動畫流暢 (60fps)
- 確保無障礙設計通過
```

#### Step 4.3: 建立 Winery Card

```bash
# CURSOR 指令
請根據 ProWine_Card_Components完整實現.md 的 Winery Card 部分，
建立 components/cards/WineryCard.tsx

要求：
1. 21:9 超寬比例
2. Parallax 效果
3. 酒莊 Logo 正確顯示 (SVG格式優先)
4. 3 欄亮點 Grid
5. Featured wines 預覽
6. 雙 CTA 按鈕
7. Hover 3D 效果 (featured variant)

注意：
⚠️ 酒莊 LOGO 必須正確顯示！
- 優先使用 SVG 格式
- 白色或金色版本
- 尺寸 120px height
- 加上 drop-shadow
```

---

## 📅 Week 2: 核心頁面開發

### Day 6-7: 首頁實作

#### Step 6.1: Hero Section

```bash
# CURSOR 指令
請建立 app/(main)/page.tsx 的 Hero Section：

要求：
1. 全螢幕 Hero (100vh)
2. 背景使用葡萄園高品質影片或圖片
3. 深色遮罩 (60% opacity)
4. 中央大標題 + 副標題
5. 雙 CTA 按鈕 (探索酒款 / 聯繫顧問)
6. 向下滾動動畫提示
7. Parallax 背景效果

視覺：
- 標題使用 Cormorant Garamond 72px
- 副標題使用 Inter 24px
- 金色強調色
- 極簡設計
```

#### Step 6.2: Featured Wines Section

```bash
# CURSOR 指令
請建立 Featured Wines Section：

要求：
1. Section 標題 + 副標題
2. 使用 WineGrid 組件 (4 columns)
3. 顯示 8 支精選酒款
4. "查看更多" 按鈕
5. 滾動時淡入動畫
6. 載入狀態處理

資料來源：
- 從 Supabase 查詢 is_featured = true
- 按照價格或評分排序
```

#### Step 6.3: Featured Wineries Section

```bash
# CURSOR 指令
請建立 Featured Wineries Section：

要求：
1. 使用 WineryGrid 組件 (2-3 columns)
2. 顯示 3-6 個精選酒莊
3. 第一個酒莊使用 featured variant
4. Stagger 動畫效果
5. 響應式 Grid

資料來源：
- 從 Supabase 查詢酒莊
- 按照得獎數量排序
```

#### Step 6.4: About Section

```bash
# CURSOR 指令
請建立 About ProWine Section：

要求：
1. 左右分欄佈局 (圖 + 文)
2. 高品質品牌故事圖片
3. ProWine 品牌故事文案
4. 3 個關鍵數據 (年份、酒莊數、客戶數)
5. "了解更多" CTA

視覺：
- 使用 primary-cream 背景
- Serif 字體作為標題
- 優雅間距 (96px section padding)
```

#### Step 6.5: Social Proof Section

```bash
# CURSOR 指令
請建立 Social Proof Section：

要求：
1. 客戶評價輪播
2. 5 星評分顯示
3. 客戶照片 + 名字 + 職稱
4. 自動輪播 (5秒間隔)
5. 指示器

視覺：
- 卡片式設計
- 淺色背景
- 引號圖示
```

#### Step 6.6: CTA Section

```bash
# CURSOR 指令
請建立最終 CTA Section：

要求：
1. 深色背景 (primary-dark)
2. 大標題 + 副標題 (白色文字)
3. 三個 CTA：
   - 加入 LINE@ (@415znht)
   - Facebook 粉絲團
   - Instagram 追蹤
4. 社交媒體圖示 (lucide-react)
5. Email 訂閱表單

整合：
- LINE@ 使用 line://ti/p/@415znht
- Facebook 連結到粉絲頁
- Instagram 連結到 @prowine2010
```

### Day 8: 商品列表頁

#### Step 8.1: Filter Sidebar

```bash
# CURSOR 指令
請建立 app/(main)/wines/page.tsx 的 Filter Sidebar：

要求：
1. 酒款類型篩選 (紅/白/氣泡/粉紅/甜)
2. 價格區間篩選 (Slider)
3. 產區篩選 (多選)
4. 酒莊篩選 (多選)
5. 葡萄品種篩選
6. 評分篩選
7. 清除篩選按鈕
8. RWD: 手機版使用 Modal

UI：
- 側邊欄固定 (sticky)
- Accordion 折疊式設計
- 選中狀態視覺回饋
- 數量標籤
```

#### Step 8.2: Sort & Display Options

```bash
# CURSOR 指令
請建立排序和顯示選項：

要求：
1. 排序選項：
   - 價格 (低到高/高到低)
   - 評分 (高到低)
   - 新到舊
   - 熱門度
2. 顯示模式：
   - Grid (2/3/4 columns)
   - List
3. 結果數量顯示
4. 分頁

UI：
- 頂部工具列
- Dropdown 選單
- Toggle 按鈕
```

#### Step 8.3: Wine Grid with Pagination

```bash
# CURSOR 指令
請實作酒款列表顯示：

要求：
1. 使用 WineGrid 組件
2. 響應式列數 (Mobile: 1, Tablet: 2, Desktop: 3-4)
3. 載入狀態 (Skeleton)
4. 空狀態處理
5. 分頁或無限滾動
6. 平滑過場動畫

效能：
- 使用 React Query 快取
- 虛擬滾動 (列表超過 50 項)
- 圖片懶載入
```

### Day 9: 商品詳情頁

#### Step 9.1: Wine Detail Header

```bash
# CURSOR 指令
請建立 app/(main)/wines/[slug]/page.tsx：

要求：
1. 左側：圖片 Gallery
   - 主圖 (大尺寸)
   - 縮圖輪播 (3-4 張)
   - 放大鏡功能
   - 360度旋轉 (如有資料)

2. 右側：Wine Info
   - 酒莊名 (可點擊)
   - 酒款名 (大標題)
   - 年份
   - 評分 + 評價數量
   - 價格 (原價 + 折扣價)
   - 庫存狀態
   - 數量選擇器
   - 加入購物車 (主 CTA)
   - 加入願望清單
   - 分享按鈕

視覺：
- 2 欄式佈局 (60/40)
- RWD: 手機版上下排列
- Sticky 購買區 (手機)
```

#### Step 9.2: Wine Details Tabs

```bash
# CURSOR 指令
請建立詳情 Tabs：

要求：
1. Tab 1: 品飲筆記
   - 視覺圖表 (Body, Acidity, Tannin)
   - 風味描述
   - 配餐建議
   - 侍酒建議

2. Tab 2: 酒款資訊
   - 葡萄品種
   - 產區 / AOC
   - 酒精度
   - 容量
   - 陳年潛力
   - 適飲期

3. Tab 3: 酒莊故事
   - 酒莊介紹
   - 釀造工藝
   - 得獎記錄

4. Tab 4: 評價 (Reviews)
   - 評分統計
   - 評價列表
   - 撰寫評價 (已購買)

UI：
- 下劃線式 Tab
- 平滑切換動畫
- Anchor 錨點
```

#### Step 9.3: Related Products

```bash
# CURSOR 指令
請建立相關推薦：

要求：
1. "您可能也喜歡" Section
2. 顯示 4-6 支相似酒款
3. 使用 WineCard 組件
4. Carousel 效果

推薦邏輯：
- 同酒莊其他酒款
- 同品種不同酒莊
- 相似價格區間
- 相似風格
```

---

## 📅 Week 3: 購物流程 + 會員系統

### Day 10: 購物車

#### Step 10.1: Cart Sidebar

```bash
# CURSOR 指令
請建立 components/cart/CartSidebar.tsx：

要求：
1. 右側滑出式 Drawer
2. 購物車項目列表：
   - 酒款圖片 (小)
   - 酒款名稱
   - 價格
   - 數量選擇器
   - 刪除按鈕
3. 小計顯示
4. 優惠碼輸入
5. 折扣顯示
6. 總計 (大字體, 金色)
7. 結帳按鈕 (主 CTA)
8. 繼續購物按鈕

狀態管理：
- 使用 Zustand
- 持久化到 localStorage
- 同步到 Supabase (已登入用戶)

動畫：
- 添加商品：彈跳動畫
- 刪除商品：滑出動畫
- 數量變化：數字翻轉
```

#### Step 10.2: Cart Page

```bash
# CURSOR 指令
請建立 app/(main)/cart/page.tsx：

要求：
1. 完整購物車清單 (Table layout)
2. 批次操作 (全選/刪除)
3. 推薦商品 Upsell
4. 訂單摘要 (Sticky sidebar)
5. 優惠券管理
6. 繼續購物 + 結帳按鈕

RWD：
- Desktop: Table layout
- Mobile: Card layout
```

### Day 11: 結帳流程

#### Step 11.1: Checkout Steps

```bash
# CURSOR 指令
請建立 app/(main)/checkout/page.tsx：

要求：
1. 步驟指示器 (1. 資訊 → 2. 運送 → 3. 付款 → 4. 確認)
2. 表單驗證 (Zod + React Hook Form)
3. 地址自動完成
4. 運送方式選擇
5. 付款方式選擇
6. 訂單摘要 (Sticky)

表單欄位：
- 收件人姓名 *
- 電話 *
- Email *
- 地址 *
- 配送時間偏好
- 發票資訊
- 備註

付款整合：
- 信用卡 (Stripe/ECPay)
- ATM轉帳
- 超商取貨付款
- LINE Pay
```

#### Step 11.2: Order Confirmation

```bash
# CURSOR 指令
請建立 app/(main)/checkout/success/page.tsx：

要求：
1. 成功圖示 + 動畫
2. 訂單號碼
3. 訂單摘要
4. 預計送達時間
5. Email 確認通知
6. 追蹤訂單按鈕
7. 繼續購物按鈕
8. 分享到社交媒體

Email：
- 使用 Resend API
- HTML 格式
- 包含訂單詳情
- PDF 發票附件
```

### Day 12: 會員系統前台

#### Step 12.1: Authentication

```bash
# CURSOR 指令
請建立認證相關頁面：

1. app/(auth)/login/page.tsx
   - Email + 密碼登入
   - 記住我
   - 忘記密碼
   - 社交登入 (Google, Facebook, LINE)

2. app/(auth)/register/page.tsx
   - 註冊表單
   - Email 驗證
   - 隱私政策同意

3. app/(auth)/forgot-password/page.tsx
   - Email 輸入
   - 重設連結發送

使用 Supabase Auth：
- signInWithPassword
- signUp
- signInWithOAuth
- resetPasswordForEmail
```

#### Step 12.2: Member Dashboard

```bash
# CURSOR 指令
請建立 app/(main)/member/page.tsx：

要求：
1. 會員等級卡片
   - 當前等級 (Bronze/Silver/Gold/Platinum)
   - 等級進度條
   - 升級所需金額
   - 等級福利說明

2. 統計卡片 Grid
   - 總訂單數
   - 累計消費
   - 紅利點數
   - 可用優惠券

3. 最近訂單
   - 訂單列表 (最新 3筆)
   - 訂單狀態
   - 快速操作

4. 個人化推薦
   - AI 推薦酒款
   - 基於購買歷史
```

#### Step 12.3: Order History

```bash
# CURSOR 指令
請建立 app/(main)/member/orders/page.tsx：

要求：
1. 訂單篩選 (狀態/日期)
2. 訂單卡片：
   - 訂單號碼
   - 下單日期
   - 狀態標籤
   - 商品縮圖
   - 總金額
   - 操作按鈕

3. 訂單詳情 Modal：
   - 完整訂單資訊
   - 配送追蹤
   - 發票下載
   - 評價商品
   - 再次購買

4. 訂單狀態：
   - 待付款
   - 處理中
   - 已出貨
   - 已送達
   - 已取消
```

#### Step 12.4: Wishlist

```bash
# CURSOR 指令
請建立 app/(main)/member/wishlist/page.tsx：

要求：
1. Wine Grid 顯示
2. 批次操作 (全選/移除/加入購物車)
3. 價格追蹤 (降價通知)
4. 分享願望清單
5. 空狀態設計

功能：
- 即時同步到 Supabase
- 降價通知 (Email)
- 到貨通知
```

#### Step 12.5: Profile Settings

```bash
# CURSOR 指令
請建立 app/(main)/member/profile/page.tsx：

要求：
1. 個人資訊編輯
   - 頭像上傳 (Cloudinary)
   - 姓名
   - Email
   - 電話
   - 生日

2. 地址管理
   - 新增/編輯/刪除
   - 設為預設

3. 偏好設定
   - 口味偏好 (問卷)
   - 喜好品種
   - 價格區間
   - Email 訂閱

4. 帳號安全
   - 修改密碼
   - 雙因素認證
   - 登入記錄
```

---

## 📅 Week 4: AI 功能實作

### Day 13-14: AI 侍酒師聊天

#### Step 13.1: Chat UI Component

```bash
# CURSOR 指令
請建立 components/ai/AISommelierChat.tsx：

參考完整設計規範的 AI 侍酒師章節。

要求：
1. 固定右下角氣泡
2. 420px x 680px 聊天視窗
3. 消息列表 (自動滾動)
4. 輸入框 + 發送按鈕
5. 快速回覆按鈕
6. 酒款推薦卡片
7. Typing indicator
8. 最小化/關閉

動畫：
- 氣泡脈動 (吸引注意)
- 視窗滑入/滑出
- 消息淡入
- 打字動畫
```

#### Step 13.2: AI Backend Integration

```bash
# CURSOR 指令
請建立 app/api/ai/chat/route.ts：

使用 Groq API (免費):

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

要求：
1. 接收用戶消息
2. 加入 System Prompt (侍酒師角色)
3. 包含庫存資訊
4. 呼叫 Groq API
5. 解析回應
6. 提取酒款推薦
7. 返回結構化資料

System Prompt：
"你是ProWine的專業AI侍酒師，名叫 Sommelier。
你的任務是根據客戶的需求、口味和預算，推薦最適合的葡萄酒。
請以親切、專業但不裝腔作勢的方式交流。
當前可供推薦的酒款：{inventory}
LINE@: @415znht"
```

#### Step 13.3: Recommendation Engine

```bash
# CURSOR 指令
請建立智能推薦引擎：

app/api/ai/recommend/route.ts

演算法：
1. 協同過濾：
   - 找到相似用戶
   - 推薦他們喜歡的酒款

2. 內容過濾：
   - 分析用戶口味檔案
   - 匹配酒款屬性

3. 混合推薦：
   - 加權結合兩種方法
   - 考慮庫存和新品

輸入：
- user_id
- context (場合)
- budget_range
- preferences

輸出：
- wine_recommendations[]
- reasoning
- alternatives[]
```

### Day 15: 搜尋功能

#### Step 15.1: Search Bar Component

```bash
# CURSOR 指令
請建立 components/search/SearchBar.tsx：

要求：
1. 自動完成 (Autocomplete)
2. 即時搜尋結果預覽
3. 搜尋歷史
4. 熱門搜尋
5. 分類搜尋 (酒款/酒莊/文章)
6. 鍵盤快捷鍵 (Cmd+K)

UI：
- Header 整合
- Modal 展開式
- 結果高亮
- 載入狀態
```

#### Step 15.2: Search Results Page

```bash
# CURSOR 指令
請建立 app/(main)/search/page.tsx：

要求：
1. 搜尋關鍵字顯示
2. 結果數量統計
3. 分類 Tab (全部/酒款/酒莊/文章)
4. 排序選項
5. 篩選器 (複用 wines 頁面)
6. 結果列表
7. 分頁

搜尋邏輯：
- 全文搜尋 (PostgreSQL FTS)
- 模糊匹配
- 相關性排序
```

---

## 📅 Week 5-6: 管理後台

### Day 16-18: Admin Dashboard

#### Step 16.1: Admin Layout

```bash
# CURSOR 指令
請建立 app/(admin)/layout.tsx：

要求：
1. 側邊欄導航
   - Dashboard
   - 訂單管理
   - 商品管理
   - 會員管理
   - 內容管理
   - 設定

2. 頂部欄
   - 搜尋
   - 通知
   - 管理員選單

3. 權限檢查 (Middleware)
4. 響應式側邊欄

保護路由：
- 檢查 user role = 'admin'
- 未授權重定向到登入頁
```

#### Step 16.2: Dashboard Overview

```bash
# CURSOR 指令
請建立 app/(admin)/admin/page.tsx：

要求：
1. KPI 卡片
   - 今日營收
   - 今日訂單
   - 待處理訂單
   - 庫存警告

2. 圖表
   - 營收趨勢 (Line Chart)
   - 訂單狀態 (Pie Chart)
   - 熱銷商品 (Bar Chart)

3. 最近活動
   - 新訂單
   - 新會員
   - 低庫存警告
   - 待審核評論

4. 快速操作
   - 新增商品
   - 處理訂單
   - 查看報表

使用 Chart.js 或 Recharts
```

#### Step 17: Order Management

```bash
# CURSOR 指令
請建立 app/(admin)/admin/orders/page.tsx：

要求：
1. 訂單列表 Table
   - 訂單號碼 (可點擊)
   - 客戶名稱
   - 訂單日期
   - 金額
   - 狀態標籤
   - 操作按鈕

2. 篩選 & 搜尋
   - 狀態篩選
   - 日期範圍
   - 關鍵字搜尋

3. 批次操作
   - 批次更新狀態
   - 批次列印發票
   - 批次匯出

4. 訂單詳情 Modal
   - 完整資訊
   - 狀態更新
   - 物流追蹤
   - 備註編輯
   - 退款處理

5. 列印功能
   - 發票
   - 出貨單
   - 標籤
```

#### Step 18: Product Management

```bash
# CURSOR 指令
請建立酒款管理頁面：

app/(admin)/admin/wines/page.tsx
- 酒款列表 (Table + Card 切換)
- 篩選 (酒莊/類型/庫存狀態)
- 批次操作 (上架/下架/刪除)

app/(admin)/admin/wines/new/page.tsx
- 新增酒款表單
- 圖片上傳 (多圖)
- 酒莊選擇
- 庫存管理
- SEO 設定

app/(admin)/admin/wines/[id]/page.tsx
- 編輯酒款
- 庫存歷史
- 銷售統計

app/(admin)/admin/wineries/page.tsx
- 酒莊管理
- Logo 上傳
- 故事編輯
```

---

## 📅 Week 7-8: PWA + 手機版優化

### Day 19-20: PWA 設定

#### Step 19.1: PWA Configuration

```bash
# CURSOR 指令
請設定 PWA：

1. 安裝 next-pwa：
npm install next-pwa

2. 更新 next.config.js：
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // your next config
});

3. 建立 public/manifest.json：
{
  "name": "ProWine - 精品葡萄酒電商",
  "short_name": "ProWine",
  "description": "台灣頂級葡萄酒進口商",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F5F1E8",
  "theme_color": "#1A1A1A",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    // ... 其他尺寸
  ]
}

4. 生成 PWA Icons：
- 使用 pwa-asset-generator
- 從 Logo 生成各尺寸
```

#### Step 19.2: Offline Support

```bash
# CURSOR 指令
請實作離線支援：

1. Service Worker 快取策略
2. 離線頁面
3. 網路狀態偵測
4. 離線購物車同步
5. 背景同步

使用 Workbox：
- CacheFirst: 圖片、字體
- NetworkFirst: API 請求
- StaleWhileRevalidate: 酒款列表
```

#### Step 20: Mobile Optimization

```bash
# CURSOR 指令
請優化手機體驗：

1. 觸控優化
   - 按鈕最小 44x44px
   - 增加點擊區域
   - 觸控回饋

2. 手勢支援
   - 滑動關閉 Modal
   - 下拉刷新
   - 左右滑動 Carousel

3. 底部導航
   - 首頁
   - 分類
   - 購物車
   - 會員

4. 固定購買按鈕 (商品詳情頁)

5. 優化表單輸入
   - 正確的 input type
   - 自動完成
   - 錯誤提示

6. 圖片優化
   - WebP 格式
   - 響應式圖片
   - 懶載入

7. 效能優化
   - Code splitting
   - Tree shaking
   - 減少 bundle 大小
```

---

## 📅 Week 9-10: 整合測試 & 優化

### Day 21-22: 測試

#### Step 21.1: Unit Testing

```bash
# CURSOR 指令
請設定測試環境：

1. 安裝依賴：
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

2. 配置 jest.config.js

3. 撰寫測試：
- components/cards/WineCard.test.tsx
- lib/utils/price.test.ts
- lib/ai/recommendation.test.ts

測試覆蓋率目標：80%+
```

#### Step 21.2: E2E Testing

```bash
# CURSOR 指令
請設定 E2E 測試：

1. 安裝 Playwright：
npm install -D @playwright/test

2. 撰寫測試場景：
- tests/e2e/checkout-flow.spec.ts
- tests/e2e/wine-search.spec.ts
- tests/e2e/ai-chat.spec.ts

3. CI/CD 整合
```

### Day 23-24: 效能優化

#### Step 23.1: Performance Audit

```bash
# CURSOR 指令
請進行效能審計：

1. Lighthouse 測試
   - Performance > 90
   - Accessibility > 95
   - Best Practices > 95
   - SEO > 95

2. 優化項目：
   - Image optimization
   - Code splitting
   - Lazy loading
   - Caching strategy
   - Bundle size reduction

3. Core Web Vitals
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1
```

#### Step 24: SEO Optimization

```bash
# CURSOR 指令
請優化 SEO：

1. Meta Tags
   - 所有頁面有 title, description
   - Open Graph tags
   - Twitter Cards

2. Structured Data
   - Product schema
   - Organization schema
   - BreadcrumbList schema

3. Sitemap & Robots.txt
   - 動態生成 sitemap.xml
   - 配置 robots.txt

4. 語義化 HTML
   - 正確使用標題層級
   - nav, article, section
   - alt text for images

5. 內部連結優化
   - 麵包屑導航
   - 相關商品連結
   - Footer links
```

---

## 📅 Week 11-12: 上線準備

### Day 25: 內容填充

```bash
# CURSOR 指令
請確保所有內容完整：

1. 執行爬蟲 (如尚未完成)
2. 驗證資料完整性
3. 檢查圖片品質
4. 校對文案
5. 填充測試資料
6. 建立範例訂單
```

### Day 26: 安全審查

```bash
# CURSOR 指令
請進行安全檢查：

1. HTTPS 設定
2. CORS 配置
3. CSP Headers
4. Rate Limiting
5. SQL Injection 防護
6. XSS 防護
7. CSRF Token
8. 環境變數保護
9. API Key 安全
10. 備份策略
```

### Day 27: 部署設定

```bash
# CURSOR 指令
請設定部署：

1. Vercel 部署
   - 連接 GitHub repo
   - 設定環境變數
   - 配置自訂網域
   - 設定 redirects

2. Cloudflare CDN
   - DNS 設定
   - SSL/TLS 設定
   - 快取規則

3. 監控設定
   - Sentry (錯誤追蹤)
   - Google Analytics
   - Vercel Analytics

4. 備份策略
   - Supabase 自動備份
   - 圖片備份
```

### Day 28: 最終檢查

```bash
# CURSOR 檢查清單
請逐項檢查：

設計 ✓
□ 所有頁面視覺一致
□ 色彩符合設計系統
□ 字體使用正確
□ 間距符合 8pt Grid
□ 動畫流暢
□ 響應式完整
□ 無幼稚 icon

功能 ✓
□ 所有連結正常
□ 所有表單可提交
□ 購物車運作正常
□ 結帳流程順暢
□ 會員系統完整
□ AI 聊天正常
□ 搜尋功能正確
□ 推薦準確

效能 ✓
□ Lighthouse > 90
□ Core Web Vitals 達標
□ 圖片已優化
□ 載入速度快

SEO ✓
□ Meta tags 完整
□ Structured data 正確
□ Sitemap 生成
□ Robots.txt 設定

安全 ✓
□ HTTPS 啟用
□ 環境變數安全
□ RLS 設定正確
□ API 受保護

內容 ✓
□ 所有酒款有資料
□ 所有酒莊有資料
□ 圖片品質高
□ 文案無錯字
□ 酒莊 Logo 正確顯示

社交整合 ✓
□ LINE@ 連結正確
□ Facebook 連結正確
□ Instagram 連結正確

PWA ✓
□ 可安裝
□ 離線支援
□ 推播通知

測試 ✓
□ 單元測試通過
□ E2E 測試通過
□ 跨瀏覽器測試
□ 跨裝置測試
```

---

## 🎯 開發最佳實踐

### Git Workflow

```bash
# 分支策略
main          # 生產環境
staging       # 測試環境
develop       # 開發環境
feature/*     # 功能分支
hotfix/*      # 緊急修復

# Commit 規範
feat: 新功能
fix: 修復
style: 樣式調整
refactor: 重構
test: 測試
docs: 文件
```

### Code Review Checklist

```markdown
□ 符合設計規範
□ TypeScript 類型完整
□ 無 console.log
□ 無硬編碼
□ 錯誤處理完整
□ 註解清楚
□ 效能考量
□ 無障礙設計
□ 響應式完整
□ 測試覆蓋
```

### 與 CURSOR 協作技巧

```markdown
1. 明確的指令
   ❌ "做一個購物車"
   ✅ "請根據 ProWine_Card_Components完整實現.md，
       建立 WineCard 組件，要求 3:4 比例，
       Hover 放大 1.05倍，金色邊框"

2. 提供範例
   - 給予參考設計
   - 給予現有組件
   - 給予設計規範連結

3. 分步執行
   - 一次一個功能
   - 測試後再繼續
   - 確保品質

4. 即時回饋
   - 發現問題立即指出
   - 要求重做不合格的
   - 讚賞好的實現

5. 文件化
   - 記錄重要決定
   - 更新設計文件
   - 維護 README
```

---

## 🚀 上線前最終確認

```bash
# Production Checklist

環境 ✓
□ .env.production 設定
□ API Keys 正確
□ Database URL 正確

效能 ✓
□ Bundle size < 200KB
□ TTI < 3.8s
□ LCP < 2.5s

安全 ✓
□ 無敏感資訊洩露
□ HTTPS only
□ Security headers

內容 ✓
□ 所有圖片有 alt
□ 所有連結可用
□ 文案無錯誤

法律 ✓
□ 隱私政策
□ 使用條款
□ Cookie 政策

備份 ✓
□ 資料庫備份
□ 圖片備份
□ 代碼備份

監控 ✓
□ 錯誤追蹤啟用
□ Analytics 啟用
□ Uptime 監控

通知 ✓
□ Email 測試
□ 訂單通知測試
□ 管理員通知測試
```

---

## 📞 需要協助？

遇到問題時：

1. **查看文件**
   - ProWine頂級設計規範完整版.md
   - ProWine_Card_Components完整實現.md
   - SKILL.md 系列

2. **檢查範例**
   - 參考現有組件
   - 查看測試案例

3. **Debug**
   - Console logs
   - Network tab
   - React DevTools

4. **尋求幫助**
   - GitHub Issues
   - Stack Overflow
   - 團隊討論

---

**記住**: 我們不是在做"還可以"的網站，我們是在打造 2026 年國際設計大獎作品！

每一行代碼、每一個像素都要追求完美。

Let's build something extraordinary! 🏆
