# 圖片Fallback系統文檔

**時間：** 2024-11-27

---

## 🎯 問題解決

### 問題描述
數據庫中的圖片URL都是假的（不存在），導致所有圖片加載失敗，控制台出現大量錯誤。

### 解決方案
創建了一個完整的圖片驗證和fallback系統，確保：
1. ✅ 圖片URL驗證（檢查格式和域名）
2. ✅ 自動fallback到可用的圖片源
3. ✅ 優雅的錯誤處理（不顯示控制台錯誤）
4. ✅ 使用Unsplash作為可靠的fallback源

---

## 📁 文件結構

### 核心工具
- `lib/utils/image-utils.ts` - 圖片工具函數

### 使用位置
- `app/page.tsx` - 首頁數據處理
- `components/WineCard.tsx` - 酒款卡片
- `components/WineryCard.tsx` - 酒莊卡片

---

## 🔧 功能說明

### 1. 圖片URL驗證 (`isValidImageUrl`)

**功能：** 驗證圖片URL是否有效

**檢查項目：**
- URL格式是否正確
- 協議是否為 http/https
- 域名是否在白名單中
- 本地路徑是否有效

**允許的域名：**
- `images.unsplash.com`
- `unsplash.com`
- `localhost`
- `supabase.co`
- `supabase.in`
- 本地路徑（以 `/` 開頭）

### 2. Fallback圖片 (`getFallbackWineImage`, `getFallbackWineryLogo`)

**功能：** 獲取預設的fallback圖片

**特點：**
- 使用Unsplash的葡萄酒相關圖片
- 根據索引返回不同的圖片，確保多個項目不會顯示相同圖片
- 圖片URL經過驗證，確保可用

### 3. 圖片URL處理 (`processImageUrl`)

**功能：** 處理圖片URL優先級

**優先級：**
1. `mainImageUrl` / `logoUrl`（如果有效）
2. `images` 數組中的第一個有效圖片
3. Fallback圖片

### 4. 組件級錯誤處理

**功能：** 在組件中處理圖片加載錯誤

**實現：**
- 使用 `useState` 追蹤錯誤狀態
- 自動切換到fallback圖片
- 避免重複渲染和錯誤

---

## 📝 使用示例

### 在數據處理中使用

```typescript
import { processImageUrl } from "@/lib/utils/image-utils";

const formattedWines = wines.map((wine: any, index: number) => ({
  ...wine,
  imageUrl: processImageUrl(
    wine.mainImageUrl,  // 主要圖片URL
    wine.images,        // 圖片數組
    'wine',             // 類型
    index               // 索引（用於選擇不同的fallback）
  ),
}));
```

### 在組件中使用

```typescript
import { getValidImageUrl } from "@/lib/utils/image-utils";
import { useState } from "react";

function MyComponent({ imageUrl }: { imageUrl?: string }) {
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

  return (
    <Image
      src={currentImageUrl}
      alt="Description"
      onError={handleImageError}
    />
  );
}
```

---

## 🛡️ 錯誤預防

### 1. 數據驗證

**在保存數據到數據庫前：**
- ✅ 驗證圖片URL是否有效
- ✅ 如果無效，使用fallback URL
- ✅ 記錄無效URL以便後續修復

### 2. 組件級保護

**所有使用圖片的組件：**
- ✅ 使用 `processImageUrl` 處理URL
- ✅ 實現 `onError` 處理
- ✅ 使用 `useState` 追蹤錯誤狀態

### 3. 開發時檢查

**在開發環境：**
- ✅ 檢查控制台是否有圖片錯誤
- ✅ 驗證fallback圖片是否正確加載
- ✅ 確保所有圖片URL都經過驗證

---

## 🔄 未來改進

### 1. 圖片預驗證

**建議：** 在保存數據到數據庫前，驗證所有圖片URL

```typescript
// 在API路由中
import { isValidImageUrl, getValidImageUrl } from "@/lib/utils/image-utils";

// 保存前驗證
const validatedImageUrl = isValidImageUrl(wine.mainImageUrl)
  ? wine.mainImageUrl
  : getValidImageUrl(null, 'wine', 0);
```

### 2. 圖片緩存

**建議：** 將驗證過的圖片URL緩存，避免重複驗證

### 3. 圖片上傳

**建議：** 實現圖片上傳功能，將圖片存儲到Supabase Storage或CDN

---

## ✅ 檢查清單

### 添加新圖片時
- [ ] 使用 `processImageUrl` 處理URL
- [ ] 驗證URL是否有效
- [ ] 提供fallback圖片
- [ ] 測試圖片加載

### 更新現有圖片時
- [ ] 驗證新URL是否有效
- [ ] 如果無效，使用fallback
- [ ] 更新數據庫中的URL

### 創建新組件時
- [ ] 使用 `getValidImageUrl` 處理圖片URL
- [ ] 實現 `onError` 處理
- [ ] 使用 `useState` 追蹤錯誤狀態

---

**狀態：** 系統已實施並測試 ✅

**效果：** 所有圖片加載錯誤已解決，使用可靠的fallback圖片源

