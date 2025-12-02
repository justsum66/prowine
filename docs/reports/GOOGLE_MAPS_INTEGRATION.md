# Google Maps API 整合完成

## API Key
- **API Key**: `AIzaSyBL360nVfkqZSxeTEJbjGWJ9Gn77uEz5wY`
- **環境變數**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## 整合位置

### 1. 聯絡我們頁面 (`/contact`)
- **組件**: `components/ContactMap.tsx`
- **功能**: 顯示公司位置和倉庫位置
- **座標**:
  - 公司：新北市新店區中興路二段192號9樓 (24.9833, 121.5397)
  - 倉庫：新北市汐止區新台五路一段102號4樓 (25.0689, 121.6397)

### 2. 酒莊詳情頁面 (`/wineries/[id]`)
- **組件**: `components/WineryMap.tsx`
- **功能**: 顯示酒莊所在產區位置
- **支援產區**:
  - Napa Valley (38.2975, -122.2869)
  - Bordeaux (44.8378, -0.5792)
  - Burgundy (47.0525, 4.8378)
  - Tuscany (43.7714, 11.2542)
  - Rioja (42.4656, -2.4456)
  - Barossa Valley (-34.5417, 138.9619)

## 測試步驟

1. **測試聯絡我們頁面**:
   - 訪問 `http://localhost:3000/contact`
   - 確認地圖正確載入
   - 確認兩個標記（公司、倉庫）都顯示

2. **測試酒莊詳情頁面**:
   - 訪問 `http://localhost:3000/wineries/[id]`（替換為實際的酒莊 ID）
   - 切換到「位置」標籤
   - 確認地圖正確載入並顯示酒莊位置

## 依賴套件
- `@react-google-maps/api`: React Google Maps 組件庫

## 注意事項
- API Key 已設置為 `NEXT_PUBLIC_` 前綴，可在客戶端使用
- 確保在 Google Cloud Console 中啟用了以下 API：
  - Maps JavaScript API
  - Geocoding API（如果需要地址轉換）
- 建議設置 API 使用限制（例如僅允許特定域名）

## 更新日期
2024-12-19

