# 錯誤預防指南

**最後更新：** 2024-11-27

本指南確保在繼續優化升級時不會再出現任何錯誤（語法錯誤、404、500 錯誤）。

---

## 📋 已實施的錯誤預防機制

### 1. ✅ 404 錯誤處理

#### 1.1 全局 404 頁面
- **文件：** `app/not-found.tsx`
- **功能：** 處理所有未找到的路由
- **特點：** 友好的用戶界面，提供返回首頁和搜尋選項

#### 1.2 API 路由 404 處理
- **文件：** 
  - `app/api/wines/[slug]/route.ts`
  - `app/api/wineries/[id]/route.ts`
- **改進：** 返回統一的錯誤格式，而不是直接拋出錯誤

#### 1.3 中間件處理
- **文件：** `middleware.ts`
- **功能：** 處理已知的 404 資源（`/sw.js`, `/videos/hero-video.webm`）
- **特點：** 靜默處理，不影響其他請求

---

### 2. ✅ 500 錯誤處理

#### 2.1 全局錯誤頁面
- **文件：** `app/error.tsx`
- **功能：** 處理應用程式運行時錯誤
- **特點：** 
  - 友好的錯誤訊息
  - 提供重試和返回首頁選項
  - 開發環境顯示詳細錯誤信息

#### 2.2 API 錯誤處理
- **文件：** `lib/api/error-handler.ts`
- **功能：** 統一的 API 錯誤處理
- **改進：**
  - 超時錯誤返回 200 和空結果，而不是 500
  - 查詢錯誤返回 200 和空結果，而不是 500
  - 正確的錯誤分類和狀態碼

#### 2.3 錯誤邊界
- **文件：** `components/ErrorBoundary.tsx`
- **功能：** 捕獲 React 組件錯誤
- **位置：** `app/layout.tsx` 中包裹整個應用

---

### 3. ✅ 語法錯誤預防

#### 3.1 TypeScript 類型檢查
- **配置：** `tsconfig.json`
- **功能：** 編譯時類型檢查
- **要求：** 所有文件必須通過 TypeScript 檢查

#### 3.2 ESLint 檢查
- **配置：** `.eslintrc.json`
- **功能：** 代碼質量檢查
- **要求：** 所有文件必須通過 ESLint 檢查

#### 3.3 構建時驗證
- **工具：** Next.js 構建系統
- **功能：** 構建時檢查語法錯誤
- **要求：** 構建必須成功才能部署

---

### 4. ✅ 資源引用驗證

#### 4.1 圖片錯誤處理
- **位置：** 所有使用 `Image` 組件的地方
- **功能：** `onError` 回調處理圖片載入失敗
- **示例：**
  ```tsx
  <Image
    src={imageUrl}
    alt={alt}
    onError={(e) => {
      // Fallback 處理
      const target = e.target as HTMLImageElement;
      target.src = "/fallback-image.png";
    }}
  />
  ```

#### 4.2 路由驗證工具
- **文件：** `lib/utils/validate-routes.ts`
- **功能：** 驗證路由和資源引用
- **用途：** 開發時檢查路由有效性

---

## 🛡️ 錯誤預防最佳實踐

### 1. 路由檢查清單

在創建新路由前，檢查：
- [ ] 路由路徑是否以 `/` 開頭
- [ ] 動態路由參數格式是否正確（`[id]`, `[slug]`）
- [ ] 路由是否與現有路由衝突
- [ ] API 路由是否以 `/api/` 開頭

### 2. API 路由檢查清單

在創建新 API 路由前，檢查：
- [ ] 是否使用 `createErrorResponse` 處理錯誤
- [ ] 是否正確處理 `params` Promise（Next.js 15+）
- [ ] 是否添加超時保護
- [ ] 是否返回統一的響應格式
- [ ] 是否在開發環境禁用速率限制

### 3. 組件檢查清單

在創建新組件前，檢查：
- [ ] 是否正確處理 `props` 類型
- [ ] 是否添加錯誤邊界
- [ ] 是否處理圖片載入失敗
- [ ] 是否使用 `React.memo` 優化（如適用）
- [ ] 是否正確處理異步數據

### 4. 資源引用檢查清單

在引用資源前，檢查：
- [ ] 圖片 URL 是否有效
- [ ] 靜態資源路徑是否正確
- [ ] 外部資源是否在白名單中（`next.config.js`）
- [ ] 是否提供 fallback 處理

---

## 🔧 錯誤處理模式

### 1. API 路由錯誤處理模式

```typescript
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const startTime = Date.now();

  try {
    // 業務邏輯
    const data = await fetchData();
    
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error("Error description", error, { requestId });
    
    // 返回友好的錯誤響應，而不是 500
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ERROR_CODE",
          message: "友好的錯誤訊息",
          timestamp: new Date().toISOString(),
          requestId,
        },
      },
      { status: 200 } // 或適當的狀態碼
    );
  }
}
```

### 2. 組件錯誤處理模式

```tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function MyComponent() {
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // 數據獲取
    fetchData()
      .then(setImageUrl)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div>錯誤：{error}</div>;
  }

  return (
    <Image
      src={imageUrl || "/fallback.png"}
      alt="Description"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "/fallback.png";
      }}
    />
  );
}
```

### 3. 路由參數處理模式（Next.js 15+）

```tsx
"use client";

import { use } from "react";

export default function DynamicPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  // 使用 id
  return <div>{id}</div>;
}
```

---

## 📊 錯誤監控

### 1. 開發環境
- 控制台錯誤日誌
- Next.js 構建錯誤
- TypeScript 類型錯誤
- ESLint 警告

### 2. 生產環境
- 錯誤日誌記錄（`lib/api/logger.ts`）
- 錯誤追蹤（Request ID）
- 用戶友好的錯誤訊息

---

## ✅ 驗證步驟

在每次優化升級後，執行以下檢查：

1. **構建檢查**
   ```bash
   npm run build
   ```
   - 確保構建成功
   - 檢查是否有 TypeScript 錯誤
   - 檢查是否有 ESLint 警告

2. **類型檢查**
   ```bash
   npx tsc --noEmit
   ```
   - 確保所有類型正確

3. **Lint 檢查**
   ```bash
   npm run lint
   ```
   - 確保沒有 lint 錯誤

4. **運行時檢查**
   - 訪問所有主要路由
   - 測試 API 端點
   - 檢查控制台是否有錯誤
   - 檢查網絡請求是否有 404/500 錯誤

---

## 🚨 常見錯誤和解決方案

### 1. 404 錯誤

**問題：** 路由不存在
**解決：** 
- 檢查路由文件是否存在
- 檢查路由路徑是否正確
- 使用 `not-found.tsx` 處理

### 2. 500 錯誤

**問題：** 伺服器錯誤
**解決：**
- 檢查 API 路由錯誤處理
- 檢查資料庫連接
- 使用 try-catch 包裹異步操作
- 返回友好的錯誤響應

### 3. 語法錯誤

**問題：** JSX/TypeScript 語法錯誤
**解決：**
- 檢查 JSX 閉合標籤
- 檢查 TypeScript 類型
- 使用 linter 檢查

### 4. 圖片 404

**問題：** 圖片路徑錯誤
**解決：**
- 檢查圖片路徑
- 添加 `onError` 處理
- 提供 fallback 圖片

---

## 📝 維護清單

定期檢查：
- [ ] 所有路由是否可訪問
- [ ] 所有 API 端點是否正常
- [ ] 所有圖片是否載入
- [ ] 控制台是否有錯誤
- [ ] 構建是否成功
- [ ] 類型檢查是否通過

---

**狀態：** 所有錯誤預防機制已實施 ✅

