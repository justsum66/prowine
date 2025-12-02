# 數據導入腳本使用說明

## 功能

此腳本會自動從 `MANUS_WINE_LIST` 資料夾讀取酒莊和酒款資料，並：

1. ✅ **解析資料**：從 Markdown 和 CSV 文件解析酒莊和酒款信息
2. ✅ **AI 生成內容**：使用 AI API 生成完整的描述、故事、品酒筆記、餐酒搭配等
3. ✅ **去重檢查**：自動檢查是否已存在，避免重複導入
4. ✅ **分批處理**：每次處理 5 個酒莊，避免 API 限流
5. ✅ **進度保存**：自動保存進度到 `import-progress.json`，支持中斷後繼續

## 使用方法

```bash
npm run import:wine-data
```

## 環境變數要求

確保以下環境變數已設置：

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 項目 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `GROQ_API_KEY` 或 `GOOGLE_AI_API_KEY` 或 `OPENROUTER_API_KEY` - AI API Key（至少一個）
- `CLOUDINARY_CLOUD_NAME` - Cloudinary 雲名稱
- `CLOUDINARY_API_KEY` - Cloudinary API Key
- `CLOUDINARY_API_SECRET` - Cloudinary API Secret

## 進度文件

腳本會自動創建 `scripts/import-progress.json` 來記錄已處理的酒莊和酒款，支持：

- **中斷後繼續**：如果腳本中斷，重新運行會從上次停止的地方繼續
- **避免重複**：已處理的項目會自動跳過

## 處理流程

1. **解析資料**：讀取 `MANUS_WINE_LIST` 資料夾中的文件
2. **分批處理酒莊**：每次處理 5 個酒莊
   - 檢查是否已存在（通過 slug）
   - 如果不存在，使用 AI 生成完整內容
   - 創建酒莊記錄
3. **處理酒款**：為每個酒莊處理其酒款
   - 檢查是否已存在
   - 使用 AI 生成完整內容
   - 創建酒款記錄
4. **保存進度**：每處理完一個項目就保存進度

## 注意事項

- ⚠️ **圖片爬蟲**：目前圖片爬蟲功能為占位符，需要後續實現
- ⚠️ **價格**：酒款價格默認為 1000，需要後續手動更新
- ⚠️ **發布狀態**：新創建的酒款默認為 `published: false`，需要手動審核後發布
- ⚠️ **API 限流**：腳本已添加延遲，避免 API 限流

## 重置進度

如果需要重新導入所有數據，刪除 `scripts/import-progress.json` 文件即可。

## 故障排除

### 錯誤：找不到環境變數
確保 `.env.local` 文件包含所有必需的環境變數。

### 錯誤：AI API 調用失敗
檢查 AI API Key 是否有效，或嘗試使用其他 AI 提供商。

### 錯誤：Supabase 連接失敗
檢查 Supabase URL 和 Service Role Key 是否正確。

### 進度文件損壞
刪除 `scripts/import-progress.json` 並重新運行腳本。

