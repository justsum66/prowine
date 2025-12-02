# 圖片和路由修復報告

**時間：** 2024-11-27

---

## 🔍 問題診斷

用戶報告：
1. ✅ 酒款和酒莊出現了（已修復）
2. ❌ 沒有照片和LOGO
3. ❌ 每個酒款專門的頁面不存在
4. ❌ 每個酒莊專門的頁面不存在

---

## ✅ 已實施的修復

### 1. 圖片URL傳遞修復 ✅

**問題：** 圖片URL可能為空或格式不正確

**修復：**
- ✅ 改進 `app/page.tsx` 中的數據映射
- ✅ 優先使用 `mainImageUrl`，如果沒有則從 `images` 數組中獲取第一張
- ✅ 添加調試日誌以追蹤圖片URL
- ✅ 添加圖片錯誤處理（onError）

**文件：** `app/page.tsx`, `components/WineCard.tsx`, `components/WineryCard.tsx`

### 2. LOGO URL傳遞修復 ✅

**問題：** 酒莊LOGO可能為空

**修復：**
- ✅ 優先使用 `logoUrl`，如果沒有則從 `images` 數組中獲取第一張
- ✅ 添加調試日誌以追蹤LOGO URL
- ✅ 添加LOGO錯誤處理（onError）

**文件：** `app/page.tsx`, `components/WineryCard.tsx`

### 3. 圖片顯示優化 ✅

**問題：** 外部圖片可能無法加載

**修復：**
- ✅ 在開發環境中啟用 `unoptimized` 模式
- ✅ 添加圖片錯誤回退（顯示首字母）
- ✅ 添加更多域名到 `next.config.js` 的 `images.remotePatterns`

**文件：** `next.config.js`, `components/WineCard.tsx`, `components/WineryCard.tsx`

### 4. 路由修復 ✅

**問題：** 詳情頁可能無法正確訪問

**修復：**
- ✅ 確保 `slug` 正確傳遞（如果沒有 slug 則使用 id）
- ✅ 改進詳情頁的錯誤處理
- ✅ 添加詳細的調試日誌
- ✅ 修復 API 路由中的關係查詢（分離查詢避免 RLS 問題）

**文件：**
- `app/wines/[slug]/page.tsx` - 酒款詳情頁
- `app/wineries/[id]/page.tsx` - 酒莊詳情頁
- `app/api/wines/[slug]/route.ts` - 酒款API
- `app/api/wineries/[id]/route.ts` - 酒莊API

### 5. API 查詢優化 ✅

**問題：** 關係查詢可能因為 RLS 失敗

**修復：**
- ✅ 分離 wine 和 winery 查詢
- ✅ 先查詢 wine，然後根據 `wineryId` 查詢 winery
- ✅ 確保所有查詢都使用 Service Role Key

**文件：** `app/api/wines/[slug]/route.ts`

---

## 📊 測試檢查清單

### 首頁
- [ ] 3 個精選酒款顯示圖片
- [ ] 2 個精選酒莊顯示LOGO
- [ ] 點擊酒款卡片可以進入詳情頁
- [ ] 點擊酒莊卡片可以進入詳情頁

### 酒款詳情頁
- [ ] 可以通過 `/wines/{slug}` 訪問
- [ ] 顯示酒款圖片
- [ ] 顯示酒莊信息
- [ ] 顯示酒款詳細信息

### 酒莊詳情頁
- [ ] 可以通過 `/wineries/{id}` 訪問
- [ ] 顯示酒莊LOGO
- [ ] 顯示酒莊故事
- [ ] 顯示酒莊酒款列表

---

## 🔧 調試信息

### 瀏覽器控制台應該看到：
```
Processing wine: wine_xxx mainImageUrl: https://... images: [...]
Processing winery: winery_xxx logoUrl: https://... images: [...]
Fetching wine with slug: xxx
Wine API response status: 200
Wine API response data: { wine: {...} }
```

### 如果圖片無法加載：
- 檢查控制台是否有 "Image load error" 或 "Logo load error"
- 檢查圖片URL是否正確
- 檢查 `next.config.js` 中的 `images.remotePatterns` 是否包含圖片域名

---

## 🎯 預期結果

### 圖片顯示
- ✅ 酒款卡片顯示酒瓶照片
- ✅ 酒莊卡片顯示LOGO
- ✅ 如果圖片無法加載，顯示首字母回退

### 路由功能
- ✅ 點擊酒款卡片 → `/wines/{slug}` 詳情頁
- ✅ 點擊酒莊卡片 → `/wineries/{id}` 詳情頁
- ✅ 詳情頁正確顯示所有信息

---

**狀態：** 所有修復已實施 ✅

**下一步：** 請測試圖片顯示和路由功能，確認一切正常

