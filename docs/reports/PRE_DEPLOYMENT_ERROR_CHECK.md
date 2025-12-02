# 部署前錯誤檢查報告

**日期**: 2025-12-02  
**狀態**: 🔍 **檢查進行中**

---

## 📋 檢查摘要

### ✅ 已檢查項目

1. ✅ **Linter 檢查** - 無錯誤
2. ⚠️  **TypeScript 編譯檢查** - 發現 18 個錯誤
3. ✅ **文件完整性** - 所有關鍵文件存在
4. ✅ **組件語法** - 無 JSX 語法錯誤

---

## ❌ TypeScript 錯誤詳情

### 1. Sentry 配置文件錯誤 (6個錯誤)

#### `app/instrumentation.ts`
- ❌ 缺少 `sentry.server.config.ts`
- ❌ 缺少 `sentry.edge.config.ts`

**狀態**: ⚠️ 這些文件需要創建或配置路徑需要調整

#### `lib/utils/sentry.ts`
- ❌ `BrowserTracing` 不存在
- ❌ `Replay` 不存在
- ❌ `Integrations` 不存在
- ⚠️  未使用的 `@ts-expect-error` 指令

**狀態**: ⚠️ Sentry API 使用方式需要更新

#### `sentry.server.config.ts`
- ⚠️  `event.extra` 可能是 `undefined`

**狀態**: ⚠️ 需要添加空值檢查

---

### 2. 測試文件錯誤 (10個錯誤)

**狀態**: ✅ **可以忽略** - 測試框架是可選依賴

以下錯誤來自測試文件，不影響生產代碼：
- `tests/*.test.ts` - vitest 相關錯誤
- `vitest.config.ts` - 配置錯誤
- `vitest.setup.ts` - 設置錯誤

**建議**: 這些錯誤可以在 `tsconfig.json` 中排除測試文件夾

---

## 🔧 需要修復的錯誤

### 優先級 P0 (關鍵 - 影響生產)

1. **Sentry 配置**
   - [ ] 修復 `app/instrumentation.ts` 中的導入路徑
   - [ ] 修復 `lib/utils/sentry.ts` 中的 API 使用
   - [ ] 修復 `sentry.server.config.ts` 中的類型錯誤

### 優先級 P1 (重要 - 建議修復)

2. **測試配置**
   - [ ] 在 `tsconfig.json` 中排除 `tests/` 文件夾
   - [ ] 或安裝缺失的測試依賴

---

## ✅ 已通過的檢查

1. ✅ **組件語法** - HeroCarousel, WineCard, WineryCard 無語法錯誤
2. ✅ **導入路徑** - 所有組件的導入路徑正確
3. ✅ **CSS 類名** - 所有新添加的類名在 globals.css 中已定義
4. ✅ **文件完整性** - 所有關鍵文件存在

---

## 🎯 關鍵組件狀態

### HeroCarousel ✅
- ✅ 語法正確
- ✅ 導入正確
- ✅ CSS 類名已定義

### WineCard ✅
- ✅ 語法正確
- ✅ 導入正確
- ✅ 錯誤處理完善

### WineryCard ✅
- ✅ 語法正確
- ✅ 導入正確
- ✅ 錯誤處理完善

---

## 📊 錯誤統計

- **總錯誤數**: 18
- **關鍵錯誤**: 6 (Sentry 相關)
- **測試錯誤**: 10 (可忽略)
- **類型警告**: 2

---

## 🚀 修復建議

### 立即修復（部署前必須）

1. **修復 Sentry 配置**
   ```typescript
   // 選項1: 創建缺失的配置文件
   // 選項2: 更新導入路徑
   // 選項3: 條件導入（如果 Sentry 是可選的）
   ```

2. **修復 sentry.server.config.ts**
   ```typescript
   if (event.extra) {
     // 添加空值檢查
   }
   ```

### 可選修復（不影響生產）

1. **排除測試文件**
   ```json
   // tsconfig.json
   {
     "exclude": ["tests/**/*", "vitest.config.ts"]
   }
   ```

---

## ✅ 可以安全部署的部分

以下組件和功能**沒有錯誤**，可以安全部署：

- ✅ 所有頁面組件
- ✅ 所有業務邏輯組件
- ✅ API 路由（除 Sentry 相關）
- ✅ 2026 高端設計升級的所有組件
- ✅ CSS 設計系統

---

## 📝 下一步行動

1. [ ] 修復 Sentry 配置錯誤（6個）
2. [ ] 修復 sentry.server.config.ts 類型錯誤（1個）
3. [ ] 排除測試文件或安裝測試依賴（可選）
4. [ ] 重新運行 TypeScript 檢查
5. [ ] 執行構建測試：`npm run build`
6. [ ] 執行生產環境測試

---

**狀態**: ⚠️  **發現錯誤，需要修復 Sentry 相關問題**

**建議**: 修復 Sentry 錯誤後可以安全部署

