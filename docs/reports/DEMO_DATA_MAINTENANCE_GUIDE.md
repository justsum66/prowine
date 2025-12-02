# DEMO數據維護指南

**目的：** 確保未來更新不會再出現圖片加載錯誤

---

## 🛡️ 預防機制

### 1. 圖片URL驗證系統 ✅

**位置：** `lib/utils/image-utils.ts`

**功能：**
- 自動驗證圖片URL格式
- 檢查域名白名單
- 自動使用fallback圖片

**使用方式：**
```typescript
import { processImageUrl } from "@/lib/utils/image-utils";

const imageUrl = processImageUrl(
  wine.mainImageUrl,  // 主要圖片URL
  wine.images,        // 圖片數組
  'wine',             // 類型
  index               // 索引
);
```

### 2. 組件級錯誤處理 ✅

**位置：** `components/WineCard.tsx`, `components/WineryCard.tsx`

**功能：**
- 使用 `useState` 追蹤錯誤狀態
- 自動切換到fallback圖片
- 避免重複渲染和控制台錯誤

**實現：**
```typescript
const [imageError, setImageError] = useState(false);
const [currentImageUrl, setCurrentImageUrl] = useState(() => 
  getValidImageUrl(imageUrl, 'wine', 0)
);

const handleImageError = () => {
  if (!imageError) {
    setImageError(true);
    const fallbackUrl = getValidImageUrl(null, 'wine', 0);
    setCurrentImageUrl(fallbackUrl);
  }
};
```

---

## 📝 更新流程

### 添加新酒莊/酒款時

1. **準備數據**
   - 收集完整文案（中英文）
   - 準備圖片URL（或使用fallback）

2. **使用工具函數**
   ```typescript
   const logoUrl = processImageUrl(
     winery.logoUrl,
     winery.images,
     'winery',
     index
   );
   ```

3. **更新數據庫**
   ```sql
   UPDATE wineries 
   SET "logoUrl" = 'https://images.unsplash.com/...'
   WHERE id = 'winery_xxx';
   ```

4. **測試顯示**
   - 檢查首頁顯示
   - 檢查詳情頁顯示
   - 確認無控制台錯誤

### 更新現有數據時

1. **驗證新URL**
   ```typescript
   const isValid = isValidImageUrl(newUrl);
   if (!isValid) {
     // 使用fallback
     newUrl = getValidImageUrl(null, 'wine', 0);
   }
   ```

2. **更新數據庫**
   ```sql
   UPDATE wines 
   SET "mainImageUrl" = 'https://images.unsplash.com/...'
   WHERE id = 'wine_xxx';
   ```

3. **測試效果**
   - 確認圖片正常加載
   - 確認無錯誤

---

## ✅ 檢查清單

### 添加新數據前
- [ ] 文案完整（中英文）
- [ ] 圖片URL有效或使用fallback
- [ ] 使用 `processImageUrl` 處理URL
- [ ] 測試圖片加載

### 更新現有數據前
- [ ] 驗證新URL是否有效
- [ ] 如果無效，使用fallback
- [ ] 更新數據庫
- [ ] 測試顯示效果

### 部署前
- [ ] 所有圖片URL都有效
- [ ] 所有LOGO URL都有效
- [ ] 所有文案都完整
- [ ] 無控制台錯誤
- [ ] 所有頁面正常顯示

---

## 🔧 工具函數說明

### `isValidImageUrl(url)`
- **功能**：驗證圖片URL是否有效
- **返回**：`boolean`
- **使用**：檢查URL格式和域名

### `getValidImageUrl(url, type, index)`
- **功能**：獲取有效的圖片URL或fallback
- **返回**：`string`
- **使用**：處理圖片URL，確保有效

### `processImageUrl(primaryUrl, images, type, index)`
- **功能**：處理圖片URL優先級
- **返回**：`string`
- **使用**：優先使用primaryUrl，然後images數組，最後fallback

---

## 🚨 常見錯誤預防

### 錯誤1：使用假的圖片URL
**預防：** 使用 `processImageUrl` 處理所有URL

### 錯誤2：圖片加載失敗
**預防：** 組件級錯誤處理，自動切換到fallback

### 錯誤3：控制台錯誤
**預防：** 使用 `useState` 追蹤錯誤狀態，避免重複處理

### 錯誤4：文案不完整
**預防：** 檢查清單確保所有字段都有值

---

**記住：** 永遠使用 `processImageUrl` 處理圖片URL，確保不會再出現圖片加載錯誤！

