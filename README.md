# ProWine 酩陽實業 - 精品葡萄酒電商平台

## 專案概述

這是一個可獲2026國際設計大獎的精品葡萄酒展示網站，採用混合型電商模式（展示+詢價，無直接付款）。

## 技術堆疊

- **前端**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion
- **後端**: Supabase (PostgreSQL + Auth + Storage)
- **AI服務**: Groq API (免費)
- **其他**: Resend (Email), Apify (爬蟲), Cloudinary (圖片CDN)

## 快速開始

### 安裝依賴

```bash
npm install
```

### 設定環境變數

複製 `.env.local` 並填入所有必要的API Keys。

### 建立資料庫

在 Supabase SQL Editor 執行 `scripts/database/schema.sql`

### 執行爬蟲

```bash
npm run scrape
```

### 開發模式

```bash
npm run dev
```

## 專案結構

```
prowine/
├── app/                    # Next.js App Router
│   ├── (main)/            # 主要頁面
│   ├── (admin)/           # 管理後台
│   └── api/               # API Routes
├── components/            # React 組件
│   ├── ui/               # 基礎 UI 組件
│   ├── cards/            # Wine/Winery Cards
│   ├── ai/               # AI 聊天組件
│   └── layouts/          # 版面組件
├── lib/                  # 工具函數
│   ├── supabase/         # Supabase 客戶端
│   └── utils/            # 通用工具
└── scripts/              # 腳本
    ├── scraper/          # 爬蟲腳本
    └── database/         # 資料庫Schema
```

## 設計系統

基於LOGO分析建立的嚴格3色系統：
- 主色：深黑 (#1A1A1A)
- 強調色：酒紅 (#722F37)
- 背景：奶油白 (#F5F1E8)
- 奢華色：金色 (#B8860B)

## 功能特色

- ✅ 完整資料爬取系統
- ✅ 統一設計系統
- ✅ AI侍酒師聊天
- ✅ 詢價系統
- ✅ PWA支援
- ✅ 管理後台
- ✅ SEO優化

## 開發進度

詳見計劃文件：`prowine.plan.md`

## License

Copyright © 2025 ProWine 酩陽實業股份有限公司

