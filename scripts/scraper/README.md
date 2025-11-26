# ProWine 爬蟲系統使用說明

## 環境準備

1. **確保環境變數已配置**
   - 檢查 `.env.local` 文件
   - 確認所有API Keys已正確設置

2. **建立資料庫Schema**
   - 登入 Supabase Dashboard
   - 進入 SQL Editor
   - 執行 `scripts/database/schema.sql`

## 執行爬蟲

### 方法1：使用增強版爬蟲（推薦）

```bash
npm run scrape:enhanced
```

### 方法2：使用原始爬蟲

```bash
npm run scrape
```

## 爬取內容

- 酒款資料（名稱、價格、圖片、描述、品飲筆記）
- 酒莊資料（名稱、Logo、故事、圖片）
- 文章資料（標題、內容、圖片、分類）

## 注意事項

1. 爬取過程可能需要較長時間
2. 圖片會自動優化並上傳到Cloudinary
3. 資料會自動保存到Supabase
4. 如果遇到錯誤，檢查環境變數和網路連接

