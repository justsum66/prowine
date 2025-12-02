# 後端邏輯實作完成報告

## 1. Google Maps API Key 申請教學

已建立詳細教學文件：`GOOGLE_MAPS_API_SETUP.md`

### 快速步驟：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案
3. 啟用「Maps JavaScript API」
4. 建立 API 金鑰
5. 設置 HTTP 參照網址限制（安全）
6. 設定計費帳戶（免費額度：每月 28,000 次載入）
7. 將金鑰加入 `.env` 檔案

---

## 2. 郵件發送功能（Resend）

### 已實作功能：

#### `lib/email.ts` - 郵件服務核心
- ✅ `sendEmail()` - 通用郵件發送函數
- ✅ `sendContactNotification()` - 聯絡表單通知（發送給客服）
- ✅ `sendContactConfirmation()` - 聯絡表單確認（發送給客戶）
- ✅ `sendReturnNotification()` - 退換貨申請通知（發送給客服）
- ✅ `sendReturnConfirmation()` - 退換貨申請確認（發送給客戶）

### 郵件模板：
- 專業 HTML 模板設計
- 品牌色彩（#8B4513）
- 響應式設計
- 包含所有必要資訊

### 使用方式：
```typescript
import { sendContactNotification, sendContactConfirmation } from "@/lib/email";

// 發送通知給客服
await sendContactNotification({
  name: "張三",
  email: "customer@example.com",
  phone: "0912-345-678",
  subject: "產品詢價",
  message: "我想了解這款酒的詳細資訊...",
});

// 發送確認給客戶
await sendContactConfirmation({
  name: "張三",
  email: "customer@example.com",
  subject: "產品詢價",
});
```

---

## 3. 圖片上傳功能

### 已實作功能：

#### `lib/upload.ts` - 圖片上傳核心
- ✅ `uploadToCloudinary()` - 上傳到 Cloudinary
- ✅ `uploadToSupabase()` - 上傳到 Supabase Storage
- ✅ `validateImageFile()` - 圖片檔案驗證
- ✅ `deleteFromCloudinary()` - 刪除 Cloudinary 圖片
- ✅ `deleteFromSupabase()` - 刪除 Supabase 圖片

### 功能特點：
- **雙重儲存支援**：Cloudinary（CDN 優化）和 Supabase Storage
- **自動優化**：圖片壓縮、格式轉換（WebP）、尺寸限制
- **檔案驗證**：類型檢查、大小限制（10MB）
- **錯誤處理**：完整的錯誤處理和日誌記錄

### API 路由：

#### `POST /api/upload` - 單檔案上傳
```typescript
const formData = new FormData();
formData.append("file", file);
formData.append("folder", "returns"); // 選填
formData.append("storage", "cloudinary"); // "cloudinary" 或 "supabase"

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});
```

#### `PUT /api/upload` - 多檔案上傳
```typescript
const formData = new FormData();
files.forEach(file => formData.append("files", file));
formData.append("folder", "returns");

const response = await fetch("/api/upload", {
  method: "PUT",
  body: formData,
});
```

### 使用範例：
```typescript
// 在組件中使用
const handleImageUpload = async (files: FileList) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });
  formData.append("folder", "returns");

  const response = await fetch("/api/upload", {
    method: "PUT",
    body: formData,
  });

  const result = await response.json();
  // result.files 包含所有上傳的圖片 URL
};
```

---

## 4. 聯絡表單 API (`/api/contact`)

### 已實作功能：
- ✅ 表單資料驗證（Email 格式、必填欄位）
- ✅ 儲存到資料庫（Inquiry 表）
- ✅ 發送通知郵件給客服
- ✅ 發送確認郵件給客戶
- ✅ 錯誤處理和日誌記錄

### 資料流程：
1. 接收表單資料
2. 驗證資料格式
3. 儲存到 `inquiries` 表
4. 發送郵件通知（客服 + 客戶）
5. 返回成功回應

---

## 5. 退換貨申請 API (`/api/returns`)

### 已實作功能：
- ✅ 訂單驗證（檢查訂單是否存在）
- ✅ 資格檢查（7 天期限）
- ✅ 申請類型驗證（退貨/換貨）
- ✅ 儲存到資料庫（Inquiry 表，使用 `specialRequest` 欄位儲存 metadata）
- ✅ 發送通知郵件給客服
- ✅ 發送確認郵件給客戶
- ✅ 生成申請編號

### 資料流程：
1. 接收申請資料
2. 驗證訂單是否存在
3. 檢查是否符合退換貨條件（7 天內）
4. 儲存申請到資料庫
5. 發送郵件通知（客服 + 客戶）
6. 返回申請編號

### 智能資格檢查：
- 自動計算訂單天數
- 驗證是否超過 7 天期限
- 返回詳細錯誤訊息

---

## 6. 環境變數設定

### 新增環境變數：
```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=您的API金鑰

# Contact Email (客服郵件地址)
CONTACT_EMAIL=service@prowine.com.tw
```

### 已存在的環境變數（確認）：
- ✅ `RESEND_API_KEY` - 郵件發送
- ✅ `CLOUDINARY_CLOUD_NAME` - 圖片上傳
- ✅ `CLOUDINARY_API_KEY` - 圖片上傳
- ✅ `CLOUDINARY_API_SECRET` - 圖片上傳
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase Storage
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase Storage

---

## 7. 資料庫整合

### Inquiry 表使用方式：
- **聯絡表單**：使用 `notes` 欄位儲存主旨和訊息
- **退換貨申請**：使用 `notes` 欄位儲存申請詳情，`specialRequest` 欄位儲存 JSON metadata

### 資料結構範例：
```typescript
// 聯絡表單
{
  name: "張三",
  email: "customer@example.com",
  phone: "0912-345-678",
  notes: "主旨：產品詢價\n\n訊息：我想了解...",
  status: "PENDING"
}

// 退換貨申請
{
  name: "張三",
  email: "customer@example.com",
  phone: "0912-345-678",
  notes: "退換貨申請 - 訂單編號：ORD123\n申請類型：退貨\n原因：...",
  specialRequest: JSON.stringify({
    orderNumber: "ORD123",
    applicationId: "RET-12345678",
    type: "return",
    images: ["url1", "url2"]
  }),
  status: "PENDING"
}
```

---

## 8. 錯誤處理

### 所有 API 都包含：
- ✅ 輸入驗證
- ✅ 錯誤日誌記錄
- ✅ 友善的錯誤訊息
- ✅ 優雅降級（資料庫失敗時仍可發送郵件）

---

## 9. 測試建議

### 郵件發送測試：
1. 提交聯絡表單，檢查：
   - 客服是否收到通知郵件
   - 客戶是否收到確認郵件
2. 提交退換貨申請，檢查：
   - 客服是否收到通知郵件
   - 客戶是否收到確認郵件

### 圖片上傳測試：
1. 上傳單張圖片（< 10MB）
2. 上傳多張圖片
3. 測試不支援的格式（應被拒絕）
4. 測試超大檔案（> 10MB，應被拒絕）

### 資料庫整合測試：
1. 檢查 `inquiries` 表是否有新記錄
2. 驗證資料格式正確
3. 檢查 JSON metadata 是否正確儲存

---

## 10. 後續優化建議

1. **郵件模板優化**：
   - 使用 React Email 建立更複雜的模板
   - 添加品牌 Logo
   - 響應式設計優化

2. **圖片上傳優化**：
   - 添加圖片預覽功能
   - 支援拖放上傳
   - 上傳進度顯示

3. **通知系統**：
   - 整合 LINE Notify（發送通知到 LINE）
   - 整合 Slack Webhook（團隊通知）
   - SMS 通知（重要申請）

4. **資料分析**：
   - 追蹤郵件開啟率
   - 分析申請處理時間
   - 客戶滿意度調查

---

## 完成狀態

✅ **Google Maps API Key 申請教學** - 完成  
✅ **郵件發送功能** - 完成  
✅ **圖片上傳功能** - 完成  
✅ **聯絡表單 API** - 完成  
✅ **退換貨申請 API** - 完成  
✅ **資料庫整合** - 完成  
✅ **錯誤處理** - 完成  

所有後端邏輯已實作完成，可以開始測試！

