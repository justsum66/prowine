# Bundle 大小分析與性能優化建議

**日期**: 2024-11-19  
**版本**: Next.js 16.0.5  
**目標**: 優化 bundle 大小，提升首次載入速度

---

## 📊 當前 Bundle 狀態

### 主要依賴分析

#### 核心框架（必需）
- `next`: ^16.0.5 - **核心框架，必需**
- `react`: ^19.2.0 - **核心框架，必需**
- `react-dom`: ^19.2.0 - **核心框架，必需**
- `typescript`: ^5.9.3 - **開發工具，不影響生產 bundle**

#### UI 庫（已優化）
- `framer-motion`: ^12.23.24 - **已通過 `optimizePackageImports` 優化**
- `lucide-react`: ^0.555.0 - **已通過 `optimizePackageImports` 優化**

#### 數據庫與認證（必需）
- `@supabase/supabase-js`: ^2.86.0 - **必需，用於數據庫操作**
- `@supabase/ssr`: ^0.8.0 - **必需，用於 SSR 認證**
- `@supabase/auth-helpers-nextjs`: ^0.10.0 - **可能可以移除（使用 @supabase/ssr 代替）**

#### 第三方服務（按需加載）
- `@google/generative-ai`: ^0.24.1 - **建議動態導入**
- `@react-google-maps/api`: ^2.20.7 - **已動態導入（ContactMap）**
- `groq-sdk`: ^0.37.0 - **建議動態導入（僅在需要時）**
- `cloudinary`: ^2.8.0 - **建議僅在服務端使用**
- `recharts`: ^3.5.0 - **建議動態導入（如果使用）**
- `react-image-crop`: ^11.0.10 - **已動態導入（ImageUploader）**

#### 表單處理（必需）
- `react-hook-form`: ^7.66.1 - **必需，用於表單驗證**
- `zod`: ^4.1.13 - **必需，用於數據驗證**
- `@hookform/resolvers`: ^5.2.2 - **必需，用於表單驗證**

#### 其他
- `resend`: ^6.5.2 - **建議僅在服務端使用**

---

## ✅ 已完成的優化

### 1. 代碼分割（8個組件）
以下組件已改為動態導入：

1. ✅ `ContactMap` - Google Maps API（~50KB）
2. ✅ `FlavorWheel` - 互動組件（~30KB）
3. ✅ `WineQuiz` - 互動組件（~25KB）
4. ✅ `WineComparison` - 比較功能（~20KB）
5. ✅ `SearchModal` - 搜尋模態框（~15KB）
6. ✅ `BrandStoryPage` - 關於頁面（~40KB）
7. ✅ `AIChatbot` - AI 客服（~35KB，已從 layout.tsx 移除）
8. ✅ `InstallPWA` - PWA 安裝提示（~10KB，已從 layout.tsx 移除）

**預估節省**: ~225KB 初始 bundle 大小

### 2. Next.js 配置優化

```javascript
// next.config.js
experimental: {
  optimizePackageImports: ["lucide-react", "framer-motion"],
}
```

**效果**:
- `lucide-react`: 只導入使用的圖標（tree-shaking）
- `framer-motion`: 只導入使用的動畫功能

**預估節省**: ~100KB

### 3. 圖片優化

- ✅ 配置 WebP/AVIF 格式支持
- ✅ 圖片懶加載（非首屏圖片）
- ✅ 模糊占位符（blur placeholder）
- ✅ 適當的 `sizes` 屬性

**效果**: 減少初始圖片載入帶寬，提升首次內容繪製（FCP）

---

## 🔍 優化建議

### 1. 進一步代碼分割

#### 高優先級（建議實施）

**A. Admin 後台組件（全部）**
```typescript
// 建議：所有 admin 頁面組件使用動態導入
// 只有管理員才會訪問，不需要在首頁載入

// app/admin/layout.tsx
const AdminSidebar = dynamic(() => import("@/components/admin/AdminSidebar"), {
  ssr: false,
});

const AdminDashboard = dynamic(() => import("@/components/admin/AdminDashboard"), {
  ssr: false,
});
```

**預估節省**: ~150KB

**B. 數據可視化組件**
```typescript
// 如果使用 recharts，建議動態導入
const WineDataVisualization = dynamic(
  () => import("@/components/WineDataVisualization"),
  { ssr: false }
);
```

**預估節省**: ~80KB（recharts）

**C. 圖片上傳組件（ImageUploader）**
- ✅ 已動態導入（在 admin 頁面中）

#### 中優先級（可選）

**D. 互動工具組件**
- ✅ `FlavorWheel` - 已動態導入
- ✅ `WineQuiz` - 已動態導入

**E. 表單組件（按需）**
- 多步驟表單可以考慮動態導入（如果使用率較低）

### 2. 依賴優化

#### 可以考慮移除的依賴

**A. `@supabase/auth-helpers-nextjs`**
- **狀態**: 可能已不再使用
- **建議**: 檢查是否所有功能都遷移到 `@supabase/ssr`
- **預估節省**: ~20KB

**檢查方法**:
```bash
grep -r "@supabase/auth-helpers-nextjs" app/ lib/
```

**B. 未使用的依賴**
- **建議**: 運行 `npm prune` 檢查未使用的依賴

#### 可以優化的依賴使用

**A. Google Maps API**
- ✅ 已動態導入 `ContactMap`
- **建議**: 考慮只在需要時載入 Google Maps API（而不是整個組件載入時）

**B. AI SDK（Google Generative AI, Groq）**
- **建議**: 僅在 API 路由中使用，不應在前端 bundle 中
- **檢查**: 確認沒有在前端組件中直接導入

**C. Cloudinary**
- **建議**: 僅在服務端使用，不應在前端 bundle 中
- **檢查**: 確認沒有在前端組件中直接導入

### 3. 圖片優化進一步建議

#### A. 圖片 CDN 配置
- ✅ 已配置 Cloudinary
- **建議**: 確保所有圖片都通過 Cloudinary 載入，使用自動優化參數

#### B. 圖片尺寸優化
- ✅ 使用 Next.js Image 組件自動優化
- **建議**: 確保所有 `<Image>` 組件都有適當的 `sizes` 屬性

#### C. 圖片預加載策略
- **建議**: 僅預加載首屏關鍵圖片（hero image）
- **方法**: 使用 `priority` 屬性（已實施）

---

## 📈 Bundle 大小目標

### 當前狀態（估算）

| Bundle | 大小（估算） | 目標 | 狀態 |
|--------|-------------|------|------|
| 主 bundle（first load） | ~400KB | < 300KB | 🟡 需優化 |
| JavaScript（gzipped） | ~150KB | < 100KB | 🟡 需優化 |
| CSS | ~50KB | < 40KB | 🟢 良好 |
| 圖片（首屏） | ~500KB | < 300KB | 🟡 需優化 |

### 優化後預期

**目標總 bundle 大小**: < 500KB（未壓縮）

**優化策略**:
1. 進一步代碼分割：-150KB
2. 移除未使用依賴：-50KB
3. 圖片優化：-200KB（首屏）
4. Tree-shaking 優化：-50KB

**預期總節省**: ~450KB

---

## 🛠️ 實施建議

### 階段 1：快速優化（1-2小時）

1. ✅ **檢查並移除未使用的依賴**
   ```bash
   npm prune
   npm audit
   ```

2. ✅ **分析 bundle 大小**
   ```bash
   npm run build
   # 查看 .next 目錄中的 bundle 分析
   ```

3. ✅ **確認所有動態導入都已生效**
   - 檢查 `dynamic()` 調用是否正確
   - 確認 `ssr: false` 設置合理

### 階段 2：進一步優化（2-4小時）

1. ✅ **Admin 組件代碼分割**
   - 所有 admin 頁面組件改為動態導入
   - Admin layout 中的組件也考慮動態導入

2. ✅ **檢查 AI SDK 使用**
   - 確認 Google Generative AI 和 Groq 僅在 API 路由中使用
   - 如果在前端使用，考慮改為 API 調用

3. ✅ **圖片優化檢查**
   - 檢查所有圖片是否使用 Next.js Image
   - 確認所有圖片都有適當的 `sizes` 屬性
   - 確認懶加載設置正確

### 階段 3：進階優化（4-8小時）

1. ✅ **虛擬滾動（如果列表很長）**
   - 考慮使用 `react-window` 或 `react-virtual` 進行虛擬滾動
   - 適用於：酒款列表頁、酒莊列表頁

2. ✅ **路由預加載優化**
   - 使用 Next.js 的預加載策略
   - 優先預加載用戶可能訪問的頁面

3. ✅ **Service Worker 優化**
   - 如果使用 PWA，優化 Service Worker 緩存策略
   - 僅緩存必要的資源

---

## 🔬 Bundle 分析工具

### 推薦工具

1. **Next.js Bundle Analyzer**
   ```bash
   # 安裝
   npm install @next/bundle-analyzer
   
   # 使用
   ANALYZE=true npm run build
   ```

2. **Webpack Bundle Analyzer**（Next.js 內建）
   ```bash
   npm run build
   # 查看 .next/analyze/ 目錄
   ```

3. **Chrome DevTools**
   - Network 面板：查看實際載入的資源
   - Coverage 面板：查看未使用的 JavaScript

---

## 📝 監控建議

### 持續監控指標

1. **首次內容繪製（FCP）**
   - 目標: < 1.8s

2. **最大內容繪製（LCP）**
   - 目標: < 2.5s

3. **首次輸入延遲（FID）**
   - 目標: < 100ms

4. **累積布局偏移（CLS）**
   - 目標: < 0.1

5. **總阻塞時間（TBT）**
   - 目標: < 200ms

### 監控工具

1. **Lighthouse**（Chrome DevTools）
   - 定期運行 Lighthouse 測試
   - 監控 Core Web Vitals

2. **Vercel Analytics**（如果部署在 Vercel）
   - 自動監控 Core Web Vitals
   - 提供真實用戶數據

3. **Google PageSpeed Insights**
   - 定期檢查網站性能
   - 獲得優化建議

---

## ✅ 下一步行動

### 立即執行（高優先級）

1. ✅ **運行 Bundle 分析**
   - 使用 Next.js Bundle Analyzer
   - 識別最大的 bundle

2. ✅ **檢查未使用的依賴**
   - 運行 `npm prune`
   - 檢查是否有重複的依賴

3. ✅ **Admin 組件代碼分割**
   - 將所有 admin 頁面組件改為動態導入

### 短期執行（中優先級）

1. ✅ **AI SDK 使用檢查**
   - 確認僅在 API 路由中使用
   - 如果在前端使用，改為 API 調用

2. ✅ **圖片優化檢查**
   - 確認所有圖片都使用 Next.js Image
   - 檢查 `sizes` 屬性是否正確

### 長期執行（低優先級）

1. ✅ **虛擬滾動實現**
   - 如果列表頁面載入很慢，考慮虛擬滾動

2. ✅ **Service Worker 優化**
   - 優化 PWA 緩存策略

---

**最後更新**: 2024-11-19  
**狀態**: 待實施  
**優先級**: P0（高）

