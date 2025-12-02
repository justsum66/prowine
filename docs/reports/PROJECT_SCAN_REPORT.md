# ProWine 專案完整掃描報告

**掃描時間**: 2024-11-19  
**專案路徑**: C:\PROJECTS\PROWINE  
**專案類型**: Next.js 15 電商網站

---

## 📊 專案概述

**ProWine 酩陽實業** - 精品葡萄酒電商網站

### 核心資訊
- **業務模式**: B2C + B2B 混合
- **目標客群**: 全客群（愛好者、一般消費者、專業買家）
- **商品規模**: 100+ 酒款，30+ 酒莊
- **價格定位**: 全價格帶（480-20000元）
- **主要產區**: 美國、法國、西班牙
- **語言**: 繁體中文 + 英文
- **品牌形象**: 新古典優雅 + 精品酒莊故事性

---

## 🛠 技術棧

### 前端
- **框架**: Next.js 16.0.5 (App Router)
- **語言**: TypeScript 5.9.3
- **React**: 19.2.0
- **樣式**: Tailwind CSS 3.4.18
- **動畫**: Framer Motion 12.23.24
- **UI 圖標**: Lucide React 0.555.0
- **字體**: Inter, Playfair Display, Cormorant Garamond

### 後端
- **資料庫**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認證**: Supabase Auth
- **API**: Next.js API Routes

### 第三方服務
- **圖片儲存**: Supabase Storage + Cloudinary
- **Email**: Resend
- **AI**: Groq + Google AI + OpenRouter
- **地圖**: Google Maps (@react-google-maps/api)
- **表單**: React Hook Form + Zod
- **圖表**: Recharts

### 開發工具
- **測試**: Vitest
- **爬蟲**: Cheerio
- **部署**: Vercel
- **代碼品質**: ESLint

---

## 📁 專案結構

```
PROWINE/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 認證相關頁面
│   ├── admin/                   # 後台管理系統
│   │   ├── analytics/           # 數據分析
│   │   ├── articles/            # 文章管理
│   │   ├── images/              # 圖片管理
│   │   ├── login/               # 後台登入
│   │   ├── orders/              # 詢價單管理
│   │   ├── settings/            # 系統設定
│   │   ├── users/               # 會員管理
│   │   ├── wineries/            # 酒莊管理
│   │   └── wines/               # 酒款管理
│   ├── api/                     # API 路由
│   │   ├── admin/               # 後台 API
│   │   ├── ai/                  # AI 相關 API
│   │   ├── articles/            # 文章 API
│   │   ├── cart/                # 購物車 API
│   │   ├── contact/             # 聯絡表單 API
│   │   ├── notifications/       # 通知 API
│   │   ├── returns/             # 退貨 API
│   │   ├── search/              # 搜尋 API
│   │   ├── upload/              # 上傳 API
│   │   ├── user/                # 用戶 API
│   │   ├── wineries/            # 酒莊 API
│   │   ├── wines/               # 酒款 API
│   │   └── wishlist/            # 願望清單 API
│   ├── about/                   # 關於我們
│   ├── account/                 # 會員中心
│   ├── auth/                    # 認證回調
│   ├── cart/                    # 購物車頁面
│   ├── contact/                 # 聯絡我們
│   ├── faq/                     # 常見問題
│   ├── knowledge/               # 品酩學堂
│   ├── login/                   # 前台登入
│   ├── returns/                 # 退貨申請
│   ├── search/                  # 搜尋結果
│   ├── shipping/                # 運送資訊
│   ├── wineries/                # 酒莊列表/詳情
│   ├── wines/                   # 酒款列表/詳情
│   ├── wishlist/                # 願望清單
│   ├── layout.tsx               # 根佈局
│   ├── page.tsx                 # 首頁
│   ├── globals.css              # 全局樣式
│   ├── metadata.ts              # 元數據
│   ├── error.tsx                # 錯誤頁面
│   ├── not-found.tsx            # 404 頁面
│   ├── robots.ts                # SEO robots
│   └── sitemap.ts               # 網站地圖
│
├── components/                   # React 元件
│   ├── admin/                   # 後台元件
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminHeader.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── ComingSoon.tsx
│   │   ├── ImageUploader.tsx
│   │   └── WineForm.tsx
│   ├── AIChatbot.tsx            # AI 客服
│   ├── BackToTopButton.tsx      # 回到頂部
│   ├── BrandStoryPage.tsx       # 品牌故事
│   ├── ClientComponents.tsx     # 客戶端元件載入
│   ├── ContactMap.tsx           # 聯絡地圖
│   ├── ErrorBoundary.tsx        # 錯誤邊界
│   ├── Footer.tsx               # 頁尾
│   ├── Header.tsx               # 頁首
│   ├── HeroCarousel.tsx         # 首頁輪播
│   ├── HorizontalCarousel.tsx   # 橫向輪播
│   ├── ImageGallery.tsx         # 圖片庫
│   ├── LoadingSpinner.tsx       # 載入動畫
│   ├── MobileBottomNav.tsx      # 手機底部導航
│   ├── SearchAndFilter.tsx      # 搜尋篩選
│   ├── WineCard.tsx             # 酒款卡片
│   ├── WineryCard.tsx           # 酒莊卡片
│   └── ... (更多元件)
│
├── lib/                          # 工具庫
│   ├── ai/                      # AI 相關
│   │   ├── generate-content.ts
│   │   └── multi-llm-provider.ts  # 多 LLM 輪替系統
│   ├── api/                     # API 工具
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   ├── middleware.ts
│   │   ├── rate-limiter.ts
│   │   └── validation.ts
│   ├── contexts/                # React Context
│   │   ├── AdminAuthContext.tsx
│   │   ├── AuthContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── WishlistContext.tsx
│   ├── middleware/              # 中間件
│   │   └── admin-middleware.ts
│   ├── services/                # 服務層
│   │   └── notification-service.ts
│   ├── supabase/                # Supabase 客戶端
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── server.ts
│   ├── utils/                   # 工具函數
│   │   ├── __tests__/           # 測試檔案
│   │   ├── accessibility.ts
│   │   ├── admin-auth.ts
│   │   ├── animations.ts
│   │   ├── button-props.ts      # 按鈕屬性工具
│   │   ├── touch-handlers.ts    # 觸控處理工具
│   │   └── ... (更多工具)
│   ├── email.ts                 # Email 服務
│   └── upload.ts                # 上傳服務
│
├── prisma/                       # Prisma 配置
│   ├── schema.prisma            # 資料庫 Schema
│   └── config.js
│
├── scripts/                      # 腳本工具
│   ├── advanced-image-scraper.ts
│   ├── scrape-wines.ts
│   ├── scrape-wineries.ts
│   ├── test-api-keys.ts
│   └── ... (更多腳本)
│
├── public/                       # 靜態資源
├── tests/                        # 測試檔案
├── docs/                         # 文檔
├── MANUS_WINE_LIST/             # 酒款資料
├── screenshots/                  # 截圖
├── middleware.ts                 # Next.js 中間件
├── next.config.js               # Next.js 配置
├── tailwind.config.js           # Tailwind 配置
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 依賴管理
└── README.md                    # 專案說明

```

---

## 🗄 資料庫模型 (Prisma Schema)

### 主要模型
1. **Winery** - 酒莊
   - 基本信息（名稱、描述、故事）
   - 圖片和 Logo
   - 關聯：wines, articles

2. **Wine** - 酒款
   - 基本信息（名稱、描述、故事、分類）
   - 價格和庫存
   - 評分和圖片
   - 關聯：winery, inquiries, cartItems, wishlistItems, orderItems

3. **User** - 會員
   - 基本信息（Email、姓名、電話）
   - 會員等級和積分
   - 關聯：inquiries, orders, cart, wishlist

4. **Order** - 訂單（詢價單）
   - 訂單狀態和運送資訊
   - 關聯：user, orderItems

5. **Article** - 文章
   - 分類和內容
   - 關聯：winery

6. **Admin** - 管理員
   - 角色和權限
   - 關聯：auditLogs

7. **其他模型**
   - Cart, CartItem - 購物車
   - Wishlist, WishlistItem - 願望清單
   - Inquiry - 詢價單
   - Coupon - 優惠券
   - Address - 地址
   - AuditLog - 審計日誌

---

## 🔌 API 端點

### 前台 API
- `GET /api/wines` - 獲取酒款列表
- `GET /api/wines/[slug]` - 獲取酒款詳情
- `GET /api/wineries` - 獲取酒莊列表
- `GET /api/wineries/[id]` - 獲取酒莊詳情
- `GET /api/search` - 搜尋
- `GET /api/articles` - 獲取文章列表
- `POST /api/cart` - 加入購物車
- `POST /api/contact` - 提交聯絡表單
- `POST /api/ai/chat` - AI 客服對話
- `POST /api/wishlist/[wineId]` - 加入願望清單
- `POST /api/notifications/subscribe` - 訂閱通知

### 後台 API
- `POST /api/admin/auth/login` - 後台登入
- `POST /api/admin/auth/logout` - 後台登出
- `GET /api/admin/auth/me` - 獲取當前管理員
- `GET /api/admin/dashboard/stats` - Dashboard 統計
- `GET /api/admin/analytics` - 數據分析
- `GET /api/admin/wines` - 獲取酒款列表（後台）
- `POST /api/admin/wines` - 創建酒款
- `PUT /api/admin/wines/[id]` - 更新酒款
- `DELETE /api/admin/wines/[id]` - 刪除酒款
- `GET /api/admin/wineries` - 獲取酒莊列表（後台）
- `GET /api/admin/orders` - 獲取詢價單列表
- `GET /api/admin/users` - 獲取會員列表
- `GET /api/admin/images` - 獲取圖片列表
- `DELETE /api/admin/images` - 刪除圖片

---

## 🎨 設計系統

### 風格
- **設計風格**: 新古典主義（Neoclassical）+ 精品感
- **色調**: 溫暖色調（primary-600, neutral-900）
- **字體**: Playfair Display（標題）+ Inter（內文）

### 觸控優化
- **工具函數**: `lib/utils/touch-handlers.ts`, `lib/utils/button-props.ts`
- **觸控目標**: 最小 44x44px
- **觸控延遲**: 使用 `touch-action: manipulation` 消除 300ms 延遲
- **點擊反饋**: `-webkit-tap-highlight-color: transparent`

---

## 🤖 AI 功能

### 多 LLM 輪替系統
- **提供者**:
  1. Groq (優先級 1) - Llama-3.3-70b-versatile
  2. Google Gemini (優先級 2) - Gemini-1.5-flash
  3. OpenRouter (優先級 3) - DeepSeek/GPT-4/Claude

- **功能**:
  - AI 客服（24/7）
  - AI 侍酒師推薦
  - AI 生成酒莊故事
  - AI 自動翻譯

---

## ✅ 已完成功能

### 前台功能
- ✅ 首頁（Hero 輪播、精選酒款/酒莊）
- ✅ 酒款列表/詳情頁
- ✅ 酒莊列表/詳情頁
- ✅ 品酩學堂（知識文章）
- ✅ 聯絡我們
- ✅ 會員系統（登入、註冊）
- ✅ 購物車
- ✅ 願望清單
- ✅ AI 客服
- ✅ 搜尋與篩選
- ✅ 響應式設計（手機/桌機）

### 後台功能
- ✅ 管理員認證系統
- ✅ Dashboard 統計
- ✅ 數據分析
- ✅ 圖片管理（部分完成）
- ✅ 會員管理（部分完成）
- ✅ 詢價單管理（部分完成）

### 優化功能
- ✅ 觸控優化（手機版）
- ✅ 錯誤處理
- ✅ 載入狀態
- ✅ SEO 優化
- ✅ 圖片優化

---

## 🚧 待完成功能

### 後台管理（部分完成）
- ⏳ 圖片管理（25%）
- ⏳ 會員管理（25%）
- ⏳ 詢價單管理（25%）
- ⏳ 數據分析（25%）
- ⏳ 文章管理 CRUD
- ⏳ 酒款管理 CRUD
- ⏳ 酒莊管理 CRUD

### 頁面優化
- ⏳ 品酩學堂頁面優化（桌機 10 項 + 手機 10 項）
- ⏳ 聯絡我們頁面優化（桌機 10 項 + 手機 10 項）
- ⏳ 酒款詳細頁面完善（AI 生成文案）
- ⏳ 酒莊詳細頁面完善（AI 生成文案、真實官網連結）
- ⏳ 關於 ProWine 頁面優化（照片補充、文案優化）

### 資料補充
- ⏳ 為所有酒款生成詳細文案（AI API）
- ⏳ 為所有酒莊生成詳細文案（AI API）
- ⏳ LOGO 補充
- ⏳ 圖片補充
- ⏳ 價格補充

---

## 🔍 已知問題

### 已修復
- ✅ 手機版按鈕點擊問題（已應用觸控優化）
- ✅ 後台登入頁面卡住問題（已修復 AdminAuthContext）
- ✅ Footer 連結重複點擊問題（已添加防抖）

### 需要注意
- ⚠️ 部分後台功能只完成 25%
- ⚠️ 資料庫中部分酒款/酒莊缺少詳細文案
- ⚠️ 部分圖片可能缺失

---

## 📋 環境變數

### 必需環境變數
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# AI API Keys
GROQ_API_KEY=
GOOGLE_AI_API_KEY=
OPENROUTER_API_KEY=

# 其他服務
RESEND_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 🧪 測試

### 測試工具
- **單元測試**: Vitest
- **E2E 測試**: Playwright (計劃中)

### 測試檔案
- `lib/utils/__tests__/touch-handlers.test.ts`
- `lib/utils/__tests__/button-props.test.ts`

---

## 📝 文檔

### 專案文檔
- `README.md` - 專案說明
- `PROJECT_REQUIREMENTS.md` - 需求規格
- `DEVELOPMENT_PROGRESS.md` - 開發進度
- `.cursor/plans/prowine-19c6d55b.plan.md` - 優化計劃

### 技術文檔
- `ADVANCED_SCRAPER_SYSTEM.md` - 爬蟲系統文檔
- `ADMIN_SYSTEM_STATUS.md` - 後台系統狀態
- `MCP_FIX_GUIDE.md` - MCP 錯誤修復指南

---

## 🚀 部署

### 部署平台
- **生產環境**: Vercel
- **開發環境**: 本地開發（端口 3000）

### 部署步驟
1. 環境變數設定
2. `npm run build`
3. Vercel 自動部署

---

## 🔧 開發指令

```bash
# 開發伺服器
npm run dev

# 生產構建
npm run build

# 啟動生產伺服器
npm start

# 代碼檢查
npm run lint
npm run lint:fix

# 爬蟲腳本
npm run scrape:wines
npm run scrape:wineries
npm run scrape:images

# 測試 API Keys
npm run test:api-keys
```

---

## 📊 專案統計

### 檔案數量
- **App 路由頁面**: ~50+ 頁面
- **API 路由**: ~40+ 端點
- **React 元件**: ~50+ 元件
- **工具函數**: ~20+ 工具檔案

### 資料庫模型
- **主要模型**: 15+ 個
- **Enum 類型**: 8+ 個

---

## 🎯 下一步優化建議

### 優先級高
1. 完成後台管理功能（剩餘 75%）
2. 使用 AI API 為所有酒款/酒莊生成詳細文案
3. 補充缺失的圖片和 LOGO
4. 優化品酩學堂和聯絡我們頁面

### 優先級中
1. 實現完整的 E2E 測試
2. 性能優化（圖片懶加載、代碼分割）
3. SEO 進一步優化
4. 多語系支援

### 優先級低
1. PWA 進階功能
2. 推送通知完整實現
3. 深色模式優化

---

## 🔗 相關資源

### 社群媒體
- LINE@: @415znht
- Facebook: https://www.facebook.com/profile.php?id=100064003571961
- Instagram: https://www.instagram.com/prowine2010/

### 技術資源
- Next.js 文檔: https://nextjs.org/docs
- Supabase 文檔: https://supabase.com/docs
- Prisma 文檔: https://www.prisma.io/docs
- Tailwind CSS 文檔: https://tailwindcss.com/docs

---

**報告生成時間**: 2024-11-19  
**掃描工具**: Cursor AI + MCP Servers  
**掃描範圍**: 完整專案結構與代碼庫

