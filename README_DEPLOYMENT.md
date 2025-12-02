# ProWine 部署指南

## 🚀 快速開始

### 1. 環境變數配置

創建 `.env.local` 文件並配置以下變數：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Sentry (可選)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_ENABLED=true

# Google AI (可選，用於 AI 功能)
GOOGLE_AI_API_KEY=your-google-ai-key

# 其他
NEXT_PUBLIC_SITE_URL=https://prowine.com.tw
```

### 2. 安裝依賴

```bash
npm install
```

### 3. 運行開發服務器

```bash
npm run dev
```

### 4. 構建生產版本

```bash
npm run build
npm start
```

---

## 📋 部署前檢查清單

### 代碼質量檢查

```bash
# Lint 檢查
npm run lint

# TypeScript 檢查
npx tsc --noEmit

# 運行測試
npm run test
```

### 資源檢查

```bash
# 檢查缺失資源
npm run check:missing-assets

# 檢查文案
npm run check:copywriting
```

### 構建測試

```bash
# 構建生產版本
npm run build

# 檢查構建產物
ls -lh .next
```

---

## 🔧 可選配置

### Sentry 錯誤追蹤

1. 註冊 Sentry 帳號並創建項目
2. 獲取 DSN
3. 配置環境變數：
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your-dsn
   NEXT_PUBLIC_SENTRY_ENABLED=true
   ```
4. 安裝 Sentry SDK（可選，如果未安裝會自動跳過）：
   ```bash
   npm install @sentry/nextjs
   ```

### Service Worker

Service Worker 已自動配置，生產環境會自動註冊。

### PWA

PWA 配置已完成，包括：
- `app/manifest.json` - 應用清單
- Service Worker - 離線支持
- 圖標配置

---

## 📚 文檔

- [API 文檔](./docs/API_DOCUMENTATION.md)
- [代碼健康度報告](./docs/reports/CODE_HEALTH_AND_QUALITY_REPORT.md)
- [改進完成報告](./docs/reports/IMPROVEMENTS_COMPLETE_REPORT.md)
- [部署檢查清單](./docs/reports/FINAL_DEPLOYMENT_CHECKLIST.md)
- [全面完成報告](./docs/reports/COMPREHENSIVE_FINAL_REPORT.md)

---

## 🆘 故障排除

### 構建失敗

1. 檢查 Node.js 版本（建議 20+）
2. 清除緩存：`rm -rf .next node_modules`
3. 重新安裝：`npm install`
4. 重新構建：`npm run build`

### Sentry 未工作

1. 檢查環境變數是否正確
2. 確認 `@sentry/nextjs` 已安裝（可選）
3. 檢查瀏覽器控制台是否有錯誤

### Service Worker 未註冊

1. 確認在生產環境（開發環境不註冊）
2. 檢查瀏覽器是否支持 Service Worker
3. 檢查 `public/sw.js` 文件是否存在

---

## 📞 支持

如有問題，請查看文檔或聯繫開發團隊。

---

## 版本

v1.0.0 - 2024-12-02

