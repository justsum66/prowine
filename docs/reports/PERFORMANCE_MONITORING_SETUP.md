# 性能監控設置指南

**日期**: 2024-11-19  
**狀態**: ✅ 已設置

---

## 📊 已實施的性能監控

### 1. Bundle 大小分析 ✅

**腳本**: `scripts/analyze-bundle.js`

**使用方法**:
```bash
npm run analyze:bundle
```

**功能**:
- 執行 Next.js build
- 分析 `.next/static` 文件夾大小
- 列出前 10 個最大的 chunks
- 顯示詳細的文件大小報告

### 2. 性能監控工具 ✅

**文件**: `lib/utils/performance-monitor.ts`

**功能**:
- ✅ API 響應時間監控
- ✅ 組件渲染時間監控
- ✅ 圖片載入時間監控
- ✅ 性能指標統計和報告

### 3. 性能監控儀表板 ✅

**組件**: `components/PerformanceDashboard.tsx`

**功能**:
- ✅ 實時性能指標顯示
- ✅ API 響應時間統計
- ✅ 渲染時間統計
- ✅ 圖片載入時間統計

---

## 🚀 建議的性能監控設置

### 1. Bundle Analyzer（可選）

**安裝**:
```bash
npm install --save-dev @next/bundle-analyzer
```

**配置 `next.config.js`**:
```javascript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**使用**:
```bash
ANALYZE=true npm run build
```

**效果**:
- 自動生成 bundle 分析報告
- 可視化顯示各個模塊的大小
- 識別大型依賴和優化機會

### 2. Web Vitals 監控（可選）

**安裝**:
```bash
npm install web-vitals
```

**配置** (在 `app/layout.tsx` 或 `_app.tsx`):
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // 發送到分析服務（例如 Google Analytics）
  console.log(metric);
  
  // 或發送到性能監控 API
  fetch('/api/analytics/vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}
```

### 3. Sentry 錯誤追蹤（可選）

**安裝**:
```bash
npm install @sentry/nextjs
```

**初始化** (創建 `sentry.client.config.ts` 和 `sentry.server.config.ts`)

**效果**:
- 自動捕獲錯誤和異常
- 性能監控
- 用戶反饋收集

---

## 📈 當前性能指標

### Bundle 大小優化

**已完成的優化**:
- ✅ 代碼分割: 11 個組件動態導入
- ✅ 預估節省: ~230KB bundle 大小
- ✅ Admin 組件不在首頁 bundle 中
- ✅ recharts 圖表庫按需載入

### 性能優化措施

**已實施**:
- ✅ 圖片優化 (WebP/AVIF, 懶加載)
- ✅ 代碼分割 (動態導入)
- ✅ Next.js 配置優化
- ✅ 骨架屏載入狀態

---

## 🔍 監控指標檢查清單

### Bundle 大小
- [ ] 首頁 bundle < 200KB (gzipped)
- [ ] 主要頁面 bundle < 300KB (gzipped)
- [ ] 代碼分割正常工作

### 載入性能
- [ ] FCP (First Contentful Paint) < 1.8s
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] TTI (Time to Interactive) < 3.8s

### 運行時性能
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] FID (First Input Delay) < 100ms
- [ ] API 響應時間 < 500ms

---

## 📝 監控命令

### 開發環境
```bash
# 啟動開發服務器（已包含性能監控）
npm run dev

# 查看性能儀表板
# 訪問 http://localhost:3000 並打開性能監控面板
```

### 生產環境構建
```bash
# 構建並分析 bundle
npm run build
npm run analyze:bundle

# 啟動生產服務器
npm start
```

### 性能測試
```bash
# Lighthouse CI (如果已設置)
npm run lighthouse

# Web Vitals 測試
# 使用 Chrome DevTools 或 PageSpeed Insights
```

---

## 🎯 性能目標

### 當前狀態
- ✅ 代碼分割: 60% 完成
- ✅ 載入狀態優化: 98% 完成
- ✅ 圖片優化: 已實施

### 優化目標
- 🎯 首頁 bundle < 200KB (gzipped)
- 🎯 Lighthouse 分數 > 95
- 🎯 Web Vitals 全部達到 "良好" 標準

---

## 📊 性能監控報告

### Bundle 大小報告位置
- `PERFORMANCE_BUNDLE_ANALYSIS.md` - Bundle 大小分析報告

### 性能優化報告位置
- `PERFORMANCE_OPTIMIZATION_REPORT.md` - 性能優化詳細報告

---

**最後更新**: 2024-11-19  
**狀態**: 性能監控基礎設置已完成，可根據需要添加更高級的監控工具。

