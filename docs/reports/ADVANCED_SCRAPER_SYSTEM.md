# PROWINE 進階圖片爬蟲系統 - 完整文檔

**建立時間：** 2024-11-27  
**版本：** v1.0.0  
**狀態：** ✅ 已完成

---

## 🎯 系統概述

這是一個強大的圖片爬蟲系統，專門用於自動獲取：
- 🍷 **酒款酒標照片**（真正的酒標，不是酒瓶照片）
- 🏰 **酒莊官方LOGO**（真正的官方LOGO）
- 📸 **酒莊真實照片**（高品質的專業照片）

### 核心特點

1. **多來源爬取**
   - 官方網站（最高優先級）
   - Wine-Searcher
   - Vivino（計劃中）
   - Google Images（備用）

2. **智能驗證**
   - 自動驗證圖片URL有效性
   - 檢查圖片格式和尺寸
   - 評分系統（0-100分）
   - 來源優先級排序

3. **自動更新**
   - 自動更新 Supabase 數據庫
   - 保留原有圖片（如果新圖片品質更好才更新）
   - 詳細的日誌記錄

4. **防爬蟲處理**
   - 請求間隔控制（2秒）
   - 重試機制（最多3次）
   - User-Agent 偽裝
   - 超時控制（30秒）

---

## 📦 安裝

### 1. 安裝依賴

```bash
npm install cheerio @types/cheerio
```

### 2. 設置環境變數

確保 `.env.local` 包含：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🚀 使用方法

### 爬取所有酒款酒標照片

```bash
npm run scrape:wines
```

### 爬取所有酒莊LOGO和照片

```bash
npm run scrape:wineries
```

### 爬取所有圖片（酒款+酒莊）

```bash
npm run scrape:images
```

---

## 📁 文件結構

```
scripts/
├── advanced-image-scraper.ts  # 核心爬蟲系統
├── scrape-wines.ts            # 酒款爬蟲腳本
├── scrape-wineries.ts         # 酒莊爬蟲腳本
├── scraper.ts                 # 原始爬蟲（PROWINE.COM.TW）
├── winery-scraper.ts          # 酒莊官網爬蟲
└── README.md                  # 使用文檔
```

---

## 🔧 核心功能

### 1. 從官方網站爬取酒標照片

```typescript
async function scrapeOfficialWineLabel(
  wineName: string,
  wineryWebsite: string
): Promise<ScrapedImage[]>
```

**流程：**
1. 訪問酒莊官方網站
2. 搜索酒款頁面連結
3. 訪問每個酒款頁面
4. 提取所有圖片
5. 返回候選圖片列表

### 2. 從官方網站爬取LOGO

```typescript
async function scrapeOfficialLogo(
  wineryWebsite: string
): Promise<ScrapedImage[]>
```

**流程：**
1. 訪問酒莊官方網站
2. 在 header、nav、footer 中查找LOGO
3. 使用多種選擇器（`.logo`, `#logo`, `[class*="logo"]`）
4. 返回候選LOGO列表

### 3. 從官方網站爬取酒莊照片

```typescript
async function scrapeOfficialWineryPhotos(
  wineryWebsite: string
): Promise<ScrapedImage[]>
```

**流程：**
1. 訪問多個頁面（/about, /story, /history, /vineyard, /winery, /estate）
2. 提取大尺寸圖片（>800px）
3. 返回候選照片列表

### 4. 圖片驗證

```typescript
async function validateImageUrl(
  url: string,
  type: 'label' | 'logo' | 'winery-photo'
): Promise<ImageValidationResult>
```

**驗證標準：**
- ✅ URL格式有效（+10分）
- ✅ 圖片可訪問（+20分）
- ✅ 正確的Content-Type（+10分）
- ✅ 圖片大小合理（+10分）
- ✅ URL包含相關關鍵字（+20分）
- ✅ 來自可靠來源（+10分）

**最低分數：** 50分（才認為有效）

### 5. 選擇最佳圖片

```typescript
function selectBestImage(
  images: ScrapedImage[]
): ScrapedImage | null
```

**排序規則：**
1. 來源優先級（official > wine-searcher > vivino > google）
2. 驗證分數（越高越好）
3. 只選擇驗證通過的圖片

---

## 📊 圖片驗證標準

### 酒標照片
- ✅ URL格式有效
- ✅ 圖片可訪問
- ✅ 格式為 JPG/PNG
- ✅ 尺寸至少 800x800px（理想）
- ✅ URL包含相關關鍵字（label, bottle, wine）

### 酒莊LOGO
- ✅ URL格式有效
- ✅ 圖片可訪問
- ✅ 格式為 PNG/SVG（透明背景）
- ✅ 尺寸至少 400x400px（理想）
- ✅ URL包含相關關鍵字（logo, brand, emblem）

### 酒莊照片
- ✅ URL格式有效
- ✅ 圖片可訪問
- ✅ 格式為 JPG
- ✅ 尺寸至少 1920x1080px（理想）
- ✅ URL包含相關關鍵字（winery, vineyard, chateau）

---

## 🎨 使用示例

### 處理單個酒款

```typescript
import { processWine } from './scripts/advanced-image-scraper';

const wine = {
  id: 'wine_darioush_darius_ii_2021',
  nameZh: '達里奧斯達里烏斯二世 2021',
  nameEn: 'Darioush Darius II 2021',
  slug: 'darioush-darius-ii-2021',
  wineryId: 'winery_darioush',
  wineryNameZh: '達里奧斯酒莊',
  wineryNameEn: 'Darioush',
  wineryWebsite: 'https://www.darioush.com',
};

await processWine(wine);
```

### 處理單個酒莊

```typescript
import { processWinery } from './scripts/advanced-image-scraper';

const winery = {
  id: 'winery_darioush',
  nameZh: '達里奧斯酒莊',
  nameEn: 'Darioush',
  slug: 'darioush',
  website: 'https://www.darioush.com',
};

await processWinery(winery);
```

---

## ⚙️ 配置選項

在 `advanced-image-scraper.ts` 中可以調整：

```typescript
const CONFIG = {
  requestDelay: 2000,      // 請求間隔（毫秒）- 避免被封
  maxRetries: 3,           // 最大重試次數
  timeout: 30000,          // 請求超時（毫秒）
  userAgent: "Mozilla/5.0...", // User-Agent 偽裝
};
```

---

## ⚠️ 注意事項

### 1. 遵守網站條款
- ✅ 遵守目標網站的 `robots.txt`
- ✅ 不要過度請求（已設置2秒間隔）
- ✅ 尊重版權和圖片使用權

### 2. 圖片品質
- ✅ 系統會自動選擇最佳圖片
- ✅ 如果找不到合適的圖片，會保留原有圖片
- ✅ 可以手動檢查和更新

### 3. 錯誤處理
- ✅ 所有錯誤都會記錄在日誌中
- ✅ 單個項目失敗不會影響其他項目
- ✅ 可以重新運行腳本繼續處理

### 4. 防爬蟲機制
- ✅ 某些網站可能有防爬蟲機制
- ✅ 如果遇到問題，可以：
  - 增加請求間隔
  - 使用代理服務器
  - 手動更新圖片

---

## 🔍 調試

### 查看詳細日誌

腳本會輸出詳細的處理日誌，包括：
- 🔍 搜索過程
- ✅ 找到的圖片URL
- 📊 驗證結果和分數
- ✅ 更新狀態

### 手動驗證圖片

```typescript
import { validateImageUrl } from './scripts/advanced-image-scraper';

const result = await validateImageUrl(
  'https://example.com/wine-label.jpg',
  'label'
);

console.log(result);
// {
//   isValid: true,
//   score: 85,
//   reasons: ['URL格式有效', '圖片可訪問', 'URL包含相關關鍵字', ...],
//   format: 'jpeg',
//   width: 1200,
//   height: 1200
// }
```

---

## 📈 未來改進

### 短期（1-2週）
- [ ] 支持 Vivino API
- [ ] 支持 Google Images API
- [ ] 改進圖片驗證邏輯（實際下載並檢查尺寸）

### 中期（1-2月）
- [ ] 圖片下載和上傳到 Supabase Storage
- [ ] 圖片壓縮和優化
- [ ] 批量處理模式
- [ ] 進度條顯示

### 長期（3-6月）
- [ ] Web UI 界面
- [ ] 定時自動更新
- [ ] 圖片品質AI評分
- [ ] 多語言支持

---

## 📝 更新日誌

### v1.0.0 (2024-11-27)
- ✅ 初始版本
- ✅ 支持官方網站爬取
- ✅ 支持 Wine-Searcher 搜索
- ✅ 圖片驗證系統
- ✅ 自動數據庫更新
- ✅ 防爬蟲處理
- ✅ 詳細日誌記錄

---

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 如何貢獻

1. Fork 項目
2. 創建功能分支
3. 提交更改
4. 推送到分支
5. 創建 Pull Request

---

## 📄 許可證

ISC

---

## 🆘 常見問題

### Q: 為什麼有些圖片找不到？

A: 可能的原因：
1. 官方網站有防爬蟲機制
2. 網站結構改變
3. 圖片URL已失效

**解決方案：**
- 手動檢查官方網站
- 使用其他來源（Wine-Searcher, Vivino）
- 手動更新數據庫

### Q: 如何手動更新圖片？

A: 參考 `scripts/update-wine-images.md` 指南

### Q: 爬蟲運行很慢？

A: 這是正常的，因為：
1. 設置了2秒請求間隔（避免被封）
2. 需要驗證每個圖片
3. 需要訪問多個頁面

**優化建議：**
- 只處理需要的項目
- 使用批量模式（計劃中）

---

**狀態：** ✅ 系統已建立，可以開始使用！

**下一步：** 運行 `npm run scrape:images` 開始爬取圖片！

