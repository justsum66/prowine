# Lint 配置和 API Keys 測試設置

**完成時間：** 2024-12-XX

---

## ✅ 已完成的設置

### 1. ESLint 配置

**文件：**
- `.eslintrc.json` - 標準 ESLint 配置（Next.js 16 兼容）
- `eslint.config.js` - Flat Config 格式（備選）

**配置特點：**
- 使用 Next.js 官方推薦配置
- TypeScript 嚴格模式
- 自動修復常用問題
- 忽略非源代碼文件

**使用方式：**
```bash
# 檢查代碼
npm run lint

# 自動修復
npm run lint:fix
```

---

### 2. API Keys 測試工具

**文件：** `scripts/test-api-keys.ts`

**功能：**
- ✅ 測試所有 API Keys 的有效性
- ✅ 每個請求 10 秒超時保護
- ✅ 友好的錯誤提示
- ✅ 詳細的測試報告

**測試的 API Keys：**

1. **AI APIs**
   - GROQ_API_KEY
   - GOOGLE_AI_API_KEY
   - OPENROUTER_API_KEY

2. **Email API**
   - RESEND_API_KEY

3. **Cloudinary**
   - CLOUDINARY_API_KEY
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_SECRET

4. **Supabase**
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY

5. **Google Maps**
   - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

6. **Web Scraping**
   - APIFY_API_KEY

**使用方式：**
```bash
# 測試所有 API Keys
npm run test:api-keys
```

---

## 🔧 超時保護機制

### 單個 API 測試超時
- 每個 API 請求最多 10 秒
- 使用 AbortController 控制
- 超時後自動跳到下一個測試

### 總測試超時
- 如果某些測試卡住，最多 2 分鐘後會強制結束
- 顯示已完成的測試結果

---

## 📊 測試結果說明

### 狀態標記
- ✅ **valid** - API Key 有效
- ❌ **invalid** - API Key 無效或已過期
- ⚠️ **missing** - API Key 未設置
- 🔴 **error** - 測試時出錯（網絡問題等）
- ⏱️ **timeout** - 請求超時

---

## 🚀 下一步

1. **運行測試**
   ```bash
   npm run test:api-keys
   ```

2. **檢查結果**
   - 查看哪些 API Keys 需要更新
   - 更新無效的 API Keys
   - 設置缺失的 API Keys

3. **運行 Lint**
   ```bash
   npm run lint
   npm run lint:fix  # 自動修復
   ```

---

## ⚠️ 注意事項

1. **環境變數**
   - 確保 `.env` 文件存在
   - API Keys 不會在測試時顯示完整內容（自動遮罩）

2. **網絡連接**
   - 測試需要網絡連接
   - 如果某些 API 無法訪問，會標記為錯誤

3. **測試時間**
   - 每個 API 最多 10 秒
   - 總時間通常 < 1 分鐘

---

## 📝 更新日誌

**2024-12-XX**
- ✅ 創建 ESLint 配置
- ✅ 創建 API Keys 測試工具
- ✅ 添加超時保護機制
- ✅ 添加友好的錯誤處理

