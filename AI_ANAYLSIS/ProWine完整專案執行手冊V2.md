# ProWine 完整專案執行手冊 V2.0

> **目標**: 12週打造羅浮宮級別、可獲2026國際設計大獎的精品葡萄酒電商平台

---

## 🎯 專案總覽

### 核心要求

```markdown
✅ 羅浮宮畫展級別精緻度
✅ 零 AI 拼湊感，完全統一風格
✅ Apple 級別的乾淨感
✅ 精品酒莊的奢華質感
✅ 原生 APP 級別的 PWA
✅ 桌機+手機+平板完美體驗
✅ 酒莊 Logo 正確顯示 (SVG優先)
✅ 專業級 Icons (lucide-react, NO 幼稚icon)
```

### API Keys 配置

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ohchipfmenenezlnnrjv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjIwNDYsImV4cCI6MjA3OTczODA0Nn0.mLY3jKvhK27H9ORHejLgt86MkUj8DsdEWal__T05rzY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2hpcGZtZW5lbmV6bG5ucmp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDE2MjA0NiwiZXhwIjoyMDc5NzM4MDQ2fQ.mZFS2IWPRb3BRzx5N2U0YxuBVtZ8XDrW1m_StZkeing

# AI (免費API)
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

# GitHub
GITHUB_REPO=https://github.com/justsum66/PROWINE.git

# App
NEXT_PUBLIC_APP_URL=http://prowine.com.tw
```

---

## 📋 執行步驟速查表

### Week 1: 初始化 + 設計系統

```bash
# Day 1: 建立專案
npx create-next-app@latest prowine --typescript --tailwind --app
cd prowine

# 安裝依賴
npm install framer-motion lucide-react zustand @supabase/supabase-js @supabase/ssr
npm install react-hook-form @hookform/resolvers zod clsx tailwind-merge
npm install sharp cheerio axios apify-client cloudinary groq-sdk

# 設定 Git
git init
git remote add origin https://github.com/justsum66/PROWINE.git

# Day 2: Supabase 資料庫
- 執行 Schema SQL (參考 CURSOR_開發步驟完整指南.md)
- 設置 RLS
- 測試連接

# Day 3: 執行爬蟲
npm run scrape          # 基礎爬取
npm run scrape:deep     # 深度爬取 (包含酒莊官網)

# Day 4-5: 建立核心組件
- Button, Input, Card (components/ui/)
- WineCard (components/cards/)
- WineryCard (components/cards/)
- 測試所有組件
```

### Week 2: 核心頁面

```bash
# Day 6-7: 首頁
app/(main)/page.tsx
- Hero Section (全螢幕 + Parallax)
- Featured Wines (8支精選)
- Featured Wineries (3-6個)
- About Section
- Social Proof
- CTA Section (LINE@/Facebook/Instagram)

# Day 8: 商品列表
app/(main)/wines/page.tsx
- Filter Sidebar (類型/價格/產區/酒莊)
- Sort & Display Options
- Wine Grid + Pagination
- 響應式設計

# Day 9: 商品詳情
app/(main)/wines/[slug]/page.tsx
- Image Gallery (放大鏡/360度)
- Wine Info (評分/價格/庫存)
- Details Tabs (品飲/資訊/故事/評價)
- Related Products
```

### Week 3: 購物 + 會員

```bash
# Day 10: 購物車
- Cart Sidebar (Drawer)
- Cart Page (完整清單)
- Zustand 狀態管理
- localStorage 持久化

# Day 11: 結帳
- Checkout Steps (4步驟)
- 表單驗證 (Zod)
- 付款整合 (ECPay)
- Order Confirmation

# Day 12: 會員系統
- Login/Register (Supabase Auth)
- Member Dashboard (等級/統計)
- Order History
- Wishlist
- Profile Settings
```

### Week 4: AI 功能

```bash
# Day 13-14: AI 侍酒師
components/ai/AISommelierChat.tsx
app/api/ai/chat/route.ts
- 使用 Groq API (免費)
- 聊天 UI (420x680px 視窗)
- 酒款推薦卡片
- 即時回應

# Day 15: 搜尋
- Search Bar (Cmd+K 快捷鍵)
- Autocomplete
- Search Results Page
- 全文搜尋 (PostgreSQL FTS)
```

### Week 5-6: 管理後台

```bash
# Day 16-18: Admin Dashboard
app/(admin)/admin/
- Dashboard (KPI + 圖表)
- Order Management (訂單處理)
- Product Management (酒款/酒莊管理)
- Member Management
- Content Management
- Settings
```

### Week 7-8: PWA + 手機版

```bash
# Day 19-20: PWA 設定
npm install next-pwa
- manifest.json
- Service Worker
- 離線支援
- 推播通知
- 安裝提示

# Day 20: 手機優化
- 觸控優化 (44x44px 最小)
- 手勢支援
- 底部導航
- 固定購買按鈕
- 圖片優化 (WebP)
- 效能優化
```

### Week 9-10: 測試 + 優化

```bash
# Day 21-22: 測試
npm install -D @testing-library/react @playwright/test
- Unit Tests (80%+ 覆蓋率)
- E2E Tests (關鍵流程)
- 跨瀏覽器測試

# Day 23-24: 效能 + SEO
- Lighthouse > 90
- Core Web Vitals 達標
- Meta Tags 完整
- Structured Data
- Sitemap + Robots.txt
```

### Week 11-12: 上線

```bash
# Day 25: 內容填充
- 確認爬蟲資料完整
- 檢查圖片品質
- 校對文案
- 酒莊 Logo 驗證

# Day 26: 安全審查
- HTTPS 設定
- Security Headers
- Rate Limiting
- 環境變數保護

# Day 27: 部署
- Vercel 部署
- Cloudflare CDN
- 自訂網域
- 監控設定

# Day 28: 最終檢查
- 逐項檢查清單
- 壓力測試
- 正式上線
```

---

## 🎨 設計規範速查

### 色彩系統

```scss
主色調:
$primary-dark: #1A1A1A;        // 主黑
$primary-gold: #B8860B;         // 深金
$primary-burgundy: #722F37;     // 勃艮地酒紅
$primary-cream: #F5F1E8;        // 奶油白

使用規則:
- 背景: 白/奶油白/極淺灰
- 文字: 主黑/深灰/中灰
- 強調: 金色 (≤5%)
- 價格: 金色
- CTA: 主黑 (Hover: 金色)
```

### 字體系統

```scss
字體:
$font-serif: 'Playfair Display', Georgia, serif;
$font-sans: 'Inter', -apple-system, sans-serif;
$font-display: 'Cormorant Garamond', serif;

字階:
H1: 60px / Bold / Display
H2: 48px / SemiBold / Serif
H3: 30px / SemiBold / Serif
Body: 16px / Regular / Sans
Button: 14px / Medium / Sans + UPPERCASE
```

### 間距系統

```scss
8pt Grid:
$space-8:   8px;   // 最小
$space-16:  16px;  // 標準
$space-24:  24px;  // 中
$space-32:  32px;  // 大
$space-64:  64px;  // 區塊
$space-128: 128px; // Section
```

### 動畫系統

```scss
Timing:
$duration-base: 300ms;
$duration-slow: 500ms;
$ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);

Hover Effects:
- Card: translateY(-8px) + shadow
- Image: scale(1.05)
- Button: 背景色轉換 + Shimmer
```

---

## 🍷 Wine Card 規範

```typescript
// 關鍵要求
尺寸: 3:4 比例
留白: 40%
Hover: 放大 1.05倍 + 金色邊框 (2px)
轉場: 300ms ease-out-expo

// 結構
<WineCard>
  <ImageSection>
    - 高解析度瓶身 (2400x3200px)
    - 白色背景
    - 得獎/限量 Badge (左上)
    - 願望清單按鈕 (右上)
    - Hover 金色邊框
  </ImageSection>
  
  <ContentSection padding="24px">
    - 酒莊名 (Serif 14px #666)
    - 酒款名 (Serif 22px Bold #1A1A1A)
    - 年份 (Sans 16px #999)
    - 品飲筆記 (Sans 14px #666, 3行)
    - Meta Info (產區/品種/酒精度)
    - 價格 (Serif 28px Bold #B8860B)
    - CTA Button (背景 #1A1A1A, Hover #B8860B)
  </ContentSection>
</WineCard>
```

---

## 🏰 Winery Card 規範

```typescript
// 關鍵要求
尺寸: 21:9 超寬
Logo: SVG 格式, 120px height, 白色/金色
Parallax: 背景圖片放大 1.1倍

// 結構
<WineryCard>
  <HeroImage ratio="21:9">
    - 超高解析度莊園照
    - 黃金時刻攝影
    - 底部漸層遮罩 (from black/70)
    - 中央 Logo (SVG, drop-shadow)
    - Hover Parallax
  </HeroImage>
  
  <ContentSection padding="32px">
    - 酒莊名 (Serif 32px Bold 置中)
    - 建立年份 (Sans 14px #999 字距2px)
    - 故事摘要 (Serif 16px, 4行, 600px寬)
    
    <HighlightsGrid columns="3">
      - 得獎記錄 (Award Icon + 數字)
      - 種植面積 (Grape Icon + 公頃)
      - 酒款數量 (Sparkles Icon + 數字)
    </HighlightsGrid>
    
    <WinePreview>
      - 4 支代表作 (3:4 小卡)
      - Hover 顯示名稱
    </WinePreview>
    
    <CTASection>
      - 探索酒款 (主 CTA, 金色 Hover)
      - 了解故事 (次 CTA, 邊框)
    </CTASection>
  </ContentSection>
</WineryCard>
```

---

## 🤖 AI 侍酒師實現

```typescript
// UI 規範
固定位置: 右下角 (bottom: 32px, right: 32px)
視窗尺寸: 420px x 680px
圓角: 16px
陰影: 0 24px 48px rgba(0,0,0,0.2)

// Groq AI 整合
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const completion = await groq.chat.completions.create({
  messages: [
    {
      role: "system",
      content: `你是ProWine的專業AI侍酒師。
      根據客戶需求推薦葡萄酒。
      親切專業，不裝腔作勢。
      
      當前庫存: ${JSON.stringify(inventory)}
      
      社交媒體:
      LINE@: @415znht
      Facebook: @100064003571961
      Instagram: @prowine2010`
    },
    {
      role: "user",
      content: userMessage
    }
  ],
  model: "mixtral-8x7b-32768",  // 免費且強大
  temperature: 0.7,
  max_tokens: 1000,
});

// 對話流程
1. 歡迎 → 快速選項 (晚餐配酒/送禮/自己品飲)
2. 需求分析 → 風格/預算/場合
3. 推薦 → 3-5支 + 理由 + 配餐 + 侍酒
4. 互動 → 問答/調整/購買
```

---

## 📱 PWA 配置

```json
// public/manifest.json
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
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/ohchipfmenenezlnnrjv\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'cloudinary-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  // ... your config
});
```

---

## 📞 社交媒體整合

### LINE@ 整合

```typescript
// components/social/LineButton.tsx
export const LineButton = () => {
  const lineUrl = `https://line.me/R/ti/p/@415znht`;
  
  return (
    <Button
      onClick={() => window.open(lineUrl, '_blank')}
      variant="outline"
      size="lg"
    >
      <MessageCircle className="mr-2" />
      加入 LINE@
    </Button>
  );
};

// 在聊天機器人中提示
"有任何問題歡迎加入我們的 LINE@ (@415znht) 獲得即時協助"
```

### Facebook 整合

```typescript
// components/social/FacebookButton.tsx
export const FacebookButton = () => {
  const facebookUrl = `https://www.facebook.com/profile.php?id=100064003571961`;
  
  return (
    <Button
      onClick={() => window.open(facebookUrl, '_blank')}
      variant="outline"
      size="lg"
    >
      <Facebook className="mr-2" />
      Facebook 粉絲團
    </Button>
  );
};
```

### Instagram 整合

```typescript
// components/social/InstagramButton.tsx
export const InstagramButton = () => {
  const instagramUrl = `https://www.instagram.com/prowine2010/`;
  
  return (
    <Button
      onClick={() => window.open(instagramUrl, '_blank')}
      variant="outline"
      size="lg"
    >
      <Instagram className="mr-2" />
      @prowine2010
    </Button>
  );
};

// Instagram Feed 整合 (可選)
// 使用 Instagram Basic Display API
// 顯示最新貼文在首頁
```

---

## ✅ 開發檢查清單

### 設計檢查

```markdown
□ 色彩使用符合設計系統
□ 字體大小/粗細正確
□ 間距使用 8pt Grid
□ 動畫流暢 (60fps)
□ 響應式完整 (Mobile/Tablet/Desktop)
□ Icon 專業 (lucide-react only)
□ 無幼稚元素
□ 視覺一致性 100%
```

### 功能檢查

```markdown
□ 所有連結可用
□ 所有表單可提交
□ 購物車正常
□ 結帳流程順暢
□ 會員系統完整
□ AI 聊天正常
□ 搜尋準確
□ 推薦合理
```

### 酒莊 Logo 檢查

```markdown
□ 所有酒莊都有 Logo
□ Logo 為 SVG 格式 (優先)
□ Logo 白色或金色版本
□ Logo 尺寸 120px height
□ Logo 有 drop-shadow
□ Logo 在 WineryCard 正確顯示
□ Logo 在酒款詳情頁顯示
```

### 效能檢查

```markdown
□ Lighthouse > 90
□ LCP < 2.5s
□ FID < 100ms
□ CLS < 0.1
□ TTI < 3.8s
□ Bundle < 200KB
```

### SEO 檢查

```markdown
□ Meta tags 完整
□ Open Graph 設定
□ Twitter Cards 設定
□ Structured Data
□ Sitemap.xml
□ Robots.txt
□ 所有圖片有 alt
```

### PWA 檢查

```markdown
□ manifest.json 正確
□ Service Worker 運作
□ 可安裝到主畫面
□ 離線頁面正常
□ 推播通知設定
□ Icons 完整 (192x192, 512x512)
```

### 社交整合檢查

```markdown
□ LINE@ 連結正確 (@415znht)
□ Facebook 連結正確
□ Instagram 連結正確
□ 分享功能正常
□ Open Graph 預覽正確
```

---

## 🚀 部署檢查清單

```bash
# 環境變數
□ 所有 API Keys 已設定
□ 生產環境 URL 正確
□ HTTPS 強制啟用

# 資料庫
□ Supabase 遷移完成
□ RLS 規則正確
□ 備份策略啟用

# CDN & 優化
□ Cloudinary 設定完成
□ 圖片 CDN 啟用
□ DNS 設定正確

# 監控
□ Sentry 錯誤追蹤
□ Google Analytics
□ Vercel Analytics
□ Uptime 監控

# 安全
□ Security Headers
□ Rate Limiting
□ CORS 設定
□ 環境變數安全
```

---

## 📚 相關文檔

1. **CURSOR_開發步驟完整指南.md** - 詳細的12週開發計劃
2. **ProWine_爬蟲系統完整實現.md** - 爬蟲腳本和資料處理
3. **ProWine_Card_Components完整實現.md** - Wine/Winery Card 代碼
4. **ProWine頂級設計規範完整版.md** - 完整設計系統

---

## 🎯 成功標準

```markdown
設計質量:
✅ 羅浮宮畫展級別精緻度
✅ 零 AI 拼湊感
✅ Apple 級別乾淨感
✅ 精品酒莊奢華感

技術質量:
✅ Lighthouse 全項 > 90
✅ 零 TypeScript 錯誤
✅ 測試覆蓋率 > 80%
✅ PWA 完整支援

商業目標:
✅ 年業績提升 50%
✅ 轉換率提升 30%
✅ 客單價提升 25%
✅ 會員留存 +40%

獲獎潛力:
✅ WebAwards
✅ Awwwards
✅ CSS Design Awards
✅ Webby Awards
✅ FWA
```

---

## 💡 關鍵提醒

### 與 CURSOR 協作

```markdown
✅ DO:
- 明確具體的指令
- 提供設計規範參考
- 一次一個功能
- 即時回饋修正
- 讚賞好的實現

❌ DON'T:
- 模糊的需求
- 跳過設計規範
- 一次多個任務
- 接受不合格的代碼
- 忽略細節問題
```

### 質量把關

```markdown
每個組件都要問:
1. 這夠精緻嗎？
2. 這夠高級嗎？
3. 這夠一致嗎？
4. 這會讓人驚艷嗎？
5. 這配得上羅浮宮嗎？

如果答案不是全部 YES，繼續優化！
```

### 酒莊 Logo 重點

```markdown
⚠️ 老闆娘特別要求：

1. 所有酒莊必須有 Logo
2. Logo 必須正確顯示
3. 優先使用 SVG 格式
4. 白色或金色版本
5. 尺寸統一 120px height
6. 加上 drop-shadow 增加層次
7. 在 WineryCard 中央顯示
8. 品質要求：清晰、專業、高級
```

---

## 🏆 最終目標

我們不是在做一個「還可以」的網站。

我們是在打造一個：
- 可以獲得 2026 年國際設計大獎
- 讓競爭對手驚艷
- 讓酒莊主動要求合作
- 讓客戶驚嘆的

**羅浮宮級別藝術品！**

---

**Let's build something extraordinary! 🍷✨**
