# 測試執行報告

## 測試套件說明

### 1. Smoke Tests (冒煙測試)
**目的**: 快速驗證基本功能是否正常  
**文件**: `scripts/run-smoke-test.ts`, `tests/smoke.test.ts`

**測試內容**:
- ✅ 服務器連接檢查
- ✅ API 端點響應檢查
  - `/api/wines`
  - `/api/wineries`
  - `/api/search`
- ✅ 頁面加載檢查
  - 首頁 (`/`)
  - 酒款頁 (`/wines`)
  - 酒莊頁 (`/wineries`)

### 2. API Tests (API 測試)
**目的**: 詳細測試所有 API 端點的功能  
**文件**: `tests/api.test.ts`

**測試內容**:
- ✅ Wines API
  - GET `/api/wines` - 獲取酒款列表
  - GET `/api/wines?featured=true` - 獲取精選酒款
  - GET `/api/wines/[slug]` - 獲取單個酒款詳情
- ✅ Wineries API
  - GET `/api/wineries` - 獲取酒莊列表
  - GET `/api/wineries?featured=true` - 獲取精選酒莊
- ✅ Search API
  - GET `/api/search?q=wine` - 搜索功能
- ✅ AI Chat API
  - POST `/api/ai/chat` - AI 聊天功能

### 3. Stress Tests (壓力測試)
**目的**: 測試系統在高負載下的表現  
**文件**: `tests/stress.test.ts`

**測試內容**:
- ✅ 並發請求測試 (10 個並發請求)
  - 目標: 至少 80% 請求成功
- ✅ 並行數據獲取
  - 目標: 在 5 秒內完成
- ✅ 快速連續請求 (5 個請求)
  - 目標: 所有請求都成功

## 執行方式

### 方式 1: 使用統一測試運行器（推薦）

```bash
# 執行所有測試
npm test

# 或
npm run test:all

# 執行單個測試套件
npm run test:smoke   # Smoke 測試
npm run test:api     # API 測試
npm run test:stress  # Stress 測試
```

### 方式 2: 直接運行測試腳本

```bash
# 使用 tsx 運行
tsx scripts/test-runner.ts

# 或運行單個測試
tsx scripts/run-smoke-test.ts
tsx tests/api.test.ts
tsx tests/stress.test.ts
```

### 方式 3: 使用 Vitest（如果已安裝）

```bash
# 運行所有測試
npx vitest run

# 運行特定測試文件
npx vitest run tests/smoke.test.ts
npx vitest run tests/api.test.ts
npx vitest run tests/stress.test.ts
```

## 前置條件

1. **啟動開發服務器**
   ```bash
   npm run dev
   ```

2. **確保環境變數已設置**
   - `.env` 文件包含所有必需的環境變數
   - 特別是 `NEXT_PUBLIC_SITE_URL`（默認: `http://localhost:3000`）

3. **確保數據庫連接正常**
   - Supabase 連接正常
   - 數據庫中有測試數據

## 測試結果解讀

### 成功標準

- **Smoke Tests**: 所有端點返回狀態碼 < 500
- **API Tests**: 
  - 所有 API 返回正確的 JSON 格式
  - 數據結構符合預期
- **Stress Tests**:
  - 並發請求: ≥80% 成功率
  - 並行請求: <5 秒完成
  - 連續請求: 100% 成功率

### 失敗處理

如果測試失敗：

1. **檢查服務器狀態**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **檢查日誌**
   - 查看服務器控制台輸出
   - 檢查錯誤信息

3. **檢查環境變數**
   ```bash
   npm run test:api-keys
   ```

4. **檢查數據庫連接**
   - 確認 Supabase 連接正常
   - 確認數據庫中有數據

## 測試配置

### 環境變數

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 超時設置

- 默認請求超時: 10 秒
- Stress 測試超時: 30-60 秒

## 持續集成

建議在 CI/CD 流程中：

1. 構建應用
   ```bash
   npm run build
   ```

2. 啟動服務器
   ```bash
   npm start &
   ```

3. 等待服務器就緒
   ```bash
   sleep 10
   ```

4. 運行測試
   ```bash
   npm test
   ```

## 測試覆蓋率

當前測試覆蓋：

- ✅ 核心 API 端點
- ✅ 主要頁面路由
- ✅ 基本功能驗證
- ✅ 性能壓力測試

待擴展：

- ⏳ 認證和授權測試
- ⏳ 錯誤處理測試
- ⏳ 邊界條件測試
- ⏳ 集成測試

## 注意事項

1. **測試環境**: 確保在開發環境運行測試，避免影響生產數據
2. **數據清理**: 某些測試可能會創建測試數據，需要清理
3. **速率限制**: Stress 測試可能會觸發速率限制，這是正常的
4. **網絡延遲**: 測試結果可能受網絡條件影響

---

**最後更新**: 2024年

