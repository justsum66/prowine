# ProWine 酩陽實業 - 精品葡萄酒電商網站

## 專案概述

這是一個使用 Next.js 15、Supabase、Prisma 建置的精品葡萄酒電商網站，採用新古典主義設計風格，提供完整的詢價系統、AI 客服、會員管理等功能。

## 技術棧

- **前端框架**: Next.js 15 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **資料庫**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **認證**: Supabase Auth
- **圖片儲存**: Supabase Storage + Cloudinary
- **Email**: Resend
- **AI**: Groq + Google AI + OpenRouter
- **部署**: Vercel
- **測試**: Vitest

## 環境變數設定

複製 `.env.example` 並建立 `.env` 檔案，填入以下資訊：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_url

# API Keys
RESEND_API_KEY=your_resend_key
GROQ_API_KEY=your_groq_key
GOOGLE_AI_API_KEY=your_google_ai_key
OPENROUTER_API_KEY=your_openrouter_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# LINE (待提供)
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_ACCESS_TOKEN=
```

## 觸控優化工具

專案提供了統一的觸控事件處理工具，用於優化手機版用戶體驗。

### 使用方式

#### 創建標準按鈕

```typescript
import { createButtonProps } from "@/lib/utils/button-props";

function MyComponent() {
  const handleClick = () => {
    console.log("按鈕被點擊");
  };

  return (
    <button
      {...createButtonProps(handleClick, {
        className: "custom-class",
        "aria-label": "操作按鈕",
        preventDefault: true,
      })}
    >
      點擊我
    </button>
  );
}
```

#### 創建標準連結

```typescript
import { createLinkProps } from "@/lib/utils/button-props";
import Link from "next/link";

function MyComponent() {
  const handleClick = () => {
    console.log("連結被點擊");
  };

  return (
    <Link
      href="/page"
      {...createLinkProps(handleClick, {
        className: "custom-link-class",
      })}
    >
      前往頁面
    </Link>
  );
}
```

#### 手動處理觸控事件

```typescript
import { createClickHandler, createTouchHandler } from "@/lib/utils/touch-handlers";

function MyComponent() {
  const handleClick = createClickHandler(() => {
    console.log("點擊");
  }, { preventDefault: true });

  const handleTouch = createTouchHandler({ stopPropagation: true });

  return (
    <div onClick={handleClick} onTouchStart={handleTouch}>
      內容
    </div>
  );
}
```

### 工具函數說明

- **`createButtonProps`**: 創建標準按鈕屬性（包含觸控優化）
- **`createLinkProps`**: 創建標準連結屬性（包含觸控優化）
- **`createClickHandler`**: 創建標準點擊事件處理器
- **`createTouchHandler`**: 創建標準觸控事件處理器
- **`createChangeHandler`**: 創建標準變更事件處理器（用於 input onChange）
- **`navigateToUrl`**: 統一導航處理（優先使用 Next.js router）

### 觸控優化特性

- ✅ 移除 300ms 點擊延遲（`touch-action: manipulation`）
- ✅ 移除點擊高亮（`-webkit-tap-highlight-color: transparent`）
- ✅ 確保最小觸控目標尺寸（44x44px）
- ✅ 自動處理事件冒泡

## 安裝與執行

```bash
# 安裝依賴
npm install

# 產生 Prisma Client
npm run db:generate

# 執行資料庫遷移
npm run db:migrate

# 開發模式
npm run dev

# 建置
npm run build

# 生產模式
npm start
```

## 專案結構

```
├── app/              # Next.js App Router 頁面
├── components/       # React 元件
├── lib/             # 工具函數和配置
│   ├── supabase/    # Supabase 客戶端
│   ├── prisma.ts    # Prisma 客戶端
│   └── ai/          # AI 服務整合
├── prisma/          # Prisma Schema
└── public/          # 靜態資源
```

## 主要功能

- ✅ 商品展示與搜尋
- ✅ 詢價系統（無金流）
- ✅ AI 客服與侍酒師推薦
- ✅ 會員系統與等級制度
- ✅ 購物車與願望清單
- ✅ 後台管理系統
- ✅ 多語系支援（中英）
- ✅ SEO 優化
- ✅ 響應式設計

## 設計風格

採用新古典主義設計風格：
- 對稱布局
- 精緻 typography
- 溫暖色調
- 大量留白
- 優雅圖示（不使用幼稚 ICON）

## 測試

專案使用 Vitest 進行單元測試。

### 執行測試

```bash
# 執行所有測試
npm test

# 監視模式
npm test -- --watch

# 測試覆蓋率
npm test -- --coverage
```

### 測試文件

工具函數已包含完整的單元測試：
- `lib/utils/__tests__/touch-handlers.test.ts` - 觸控事件處理測試
- `lib/utils/__tests__/button-props.test.ts` - 按鈕屬性工具測試

### 測試配置

測試配置位於 `vitest.config.ts`，使用 jsdom 環境模擬瀏覽器環境。

## 授權

ISC

