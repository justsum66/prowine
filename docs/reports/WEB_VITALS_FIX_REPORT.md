# Web Vitals 構建錯誤修復報告

## 🔍 問題診斷

### 錯誤信息
```
Parsing ecmascript source code failed
./lib/utils/web-vitals.ts:142:2
Expected '}', got '<eof>'
```

### 根本原因
1. **缺少 `web-vitals` 包**: TypeScript 編譯時無法找到 `web-vitals` 模塊
2. **動態導入在構建時檢查**: Next.js Turbopack 在構建時會檢查動態導入的模塊

## ✅ 修復方案

### 方案1: 安裝 web-vitals 包（推薦）
```bash
npm install web-vitals
```

### 方案2: 修改代碼使其可選
如果不想安裝 `web-vitals` 包，可以修改代碼使其完全可選：

```typescript
export function initWebVitals() {
  if (typeof window === "undefined") return;

  // 動態導入 web-vitals 庫（避免增加初始 bundle 大小）
  // 如果未安裝 web-vitals，靜默失敗
  try {
    // 使用類型斷言避免構建時錯誤
    import("web-vitals" as any)
      .then((webVitals: any) => {
        // ... 處理邏輯
      })
      .catch(() => {
        // 靜默失敗
      });
  } catch (error) {
    // 構建時錯誤處理
  }
}
```

## 📝 建議

**推薦安裝 `web-vitals` 包**，因為：
1. 這是 Google 推薦的 Core Web Vitals 監控庫
2. 代碼已經設計為動態導入，不會增加初始 bundle 大小
3. 有助於監控網站性能指標

## 🎯 執行步驟

1. 安裝包: `npm install web-vitals`
2. 重新構建: `npm run build`
3. 驗證修復: 檢查是否還有構建錯誤

