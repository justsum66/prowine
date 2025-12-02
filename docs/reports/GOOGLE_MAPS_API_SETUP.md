# Google Maps API Key 申請教學

## 步驟 1：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 使用您的 Google 帳戶登入
3. 點擊頂部導航欄的「專案選擇器」
4. 點擊「新增專案」
5. 輸入專案名稱（例如：`ProWine Maps`）
6. 點擊「建立」

## 步驟 2：啟用 Google Maps API

1. 在左側選單中，點擊「API 和服務」>「程式庫」
2. 搜尋「Maps JavaScript API」
3. 點擊進入，然後點擊「啟用」
4. 重複上述步驟，啟用以下 API：
   - **Maps JavaScript API**（必需，用於顯示地圖）
   - **Geocoding API**（選用，用於地址轉換座標）
   - **Places API**（選用，用於地點搜尋）

## 步驟 3：建立 API 金鑰

1. 在左側選單中，點擊「API 和服務」>「憑證」
2. 點擊頂部的「建立憑證」>「API 金鑰」
3. 系統會自動生成一個 API 金鑰
4. **複製這個金鑰**（格式類似：`AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`）

## 步驟 4：設置 API 金鑰限制（重要！）

為了安全，建議設置使用限制：

1. 點擊剛建立的 API 金鑰進行編輯
2. 在「應用程式限制」中：
   - 選擇「HTTP 參照網址（網站）」
   - 點擊「新增項目」
   - 輸入您的網域：
     - `http://localhost:3000/*`（開發環境）
     - `https://yourdomain.com/*`（生產環境）
     - `https://*.vercel.app/*`（如果使用 Vercel）
3. 在「API 限制」中：
   - 選擇「限制金鑰」
   - 勾選您啟用的 API：
     - Maps JavaScript API
     - Geocoding API（如果有啟用）
     - Places API（如果有啟用）
4. 點擊「儲存」

## 步驟 5：設定計費帳戶（免費額度）

Google Maps API 提供每月免費額度：
- **Maps JavaScript API**: 每月 28,000 次載入（免費）
- **Geocoding API**: 每月 40,000 次請求（免費）

1. 在左側選單中，點擊「計費」
2. 點擊「連結計費帳戶」
3. 按照指示完成設定（需要信用卡，但不會在免費額度內收費）

## 步驟 6：將 API 金鑰加入專案

1. 打開專案的 `.env` 檔案
2. 添加以下行：
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=您的API金鑰
   ```
3. 同時更新 `env.template` 檔案，添加：
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
   ```
4. 重新啟動開發伺服器

## 驗證設定

1. 啟動開發伺服器：`npm run dev`
2. 訪問 `/contact` 或 `/wineries/[id]` 頁面
3. 如果地圖正常顯示，表示設定成功！

## 常見問題

### Q: API 金鑰顯示「此頁面無法載入 Google 地圖」？
A: 檢查：
- API 金鑰是否正確複製
- 是否啟用了 Maps JavaScript API
- HTTP 參照網址限制是否包含當前網域
- 是否設定了計費帳戶

### Q: 如何查看 API 使用量？
A: 在 Google Cloud Console 中：
- 「API 和服務」>「儀表板」> 查看各 API 的使用量

### Q: 免費額度用完了怎麼辦？
A: Google 會自動開始收費，但您可以：
- 設置預算提醒
- 在「API 和服務」>「配額」中設置使用限制

## 安全建議

1. **永遠不要**將 API 金鑰提交到公開的 Git 儲存庫
2. 使用環境變數儲存 API 金鑰
3. 設置 HTTP 參照網址限制
4. 設置 API 限制（只啟用需要的 API）
5. 定期檢查 API 使用量

## 相關連結

- [Google Maps Platform 官方文件](https://developers.google.com/maps/documentation)
- [Maps JavaScript API 文件](https://developers.google.com/maps/documentation/javascript)
- [定價資訊](https://developers.google.com/maps/billing-and-pricing/pricing)
