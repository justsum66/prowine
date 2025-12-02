# 圖片顯示問題修復報告

**時間：** 2024-11-27  
**問題：** 爬蟲成功更新數據庫，但前端頁面沒有顯示圖片

---

## 🔍 問題分析

### 根本原因

爬蟲成功更新了數據庫中的圖片URL：
- `wine_staglin_salus_2018`: `https://s3.amazonaws.com/efcheckout/staglinfamily/content/...`
- `winery_staglin`: `https://s3.amazonaws.com/efcheckout/staglinfamily/content/...`

但前端沒有顯示，因為：

1. **圖片驗證函數過於嚴格**
   - `lib/utils/image-utils.ts` 中的 `isValidImageUrl` 函數
   - 只允許特定的域名（`images.unsplash.com`, `supabase.co` 等）
   - **沒有包含 `s3.amazonaws.com`**
   - 導致 `isValidImageUrl` 返回 `false`
   - `processImageUrl` 會使用 fallback 圖片而不是真正的圖片URL

2. **Next.js Image 組件配置缺失**
   - `next.config.js` 中的 `remotePatterns` 沒有包含 `s3.amazonaws.com`
   - Next.js Image 組件無法加載外部圖片
   - 會顯示錯誤或使用 fallback

---

## ✅ 修復方案

### 1. 更新圖片驗證函數

**文件：** `lib/utils/image-utils.ts`

**修改：** 添加 AWS S3 和其他常見圖片域名到允許列表

```typescript
const allowedDomains = [
  'images.unsplash.com',
  'unsplash.com',
  'localhost',
  'supabase.co',
  'supabase.in',
  's3.amazonaws.com',        // ✅ 新增：AWS S3
  'amazonaws.com',            // ✅ 新增：AWS S3 (通用)
  'darioush.com',            // ✅ 新增：酒莊網站
  'staglinfamily.com',       // ✅ 新增：酒莊網站
  'chateau-margaux.com',     // ✅ 新增：酒莊網站
  'vegasicilia.es',          // ✅ 新增：酒莊網站
  'wine-searcher.com',       // ✅ 新增：專業數據庫
  'vivino.com',              // ✅ 新增：專業數據庫
];
```

### 2. 更新 Next.js Image 配置

**文件：** `next.config.js`

**修改：** 添加 AWS S3 到 `remotePatterns`

```javascript
{
  protocol: "https",
  hostname: "s3.amazonaws.com",
},
{
  protocol: "https",
  hostname: "**.s3.amazonaws.com",
},
{
  protocol: "https",
  hostname: "**.s3.*.amazonaws.com",
},
```

---

## 🎯 修復效果

### 修復前
- ❌ `isValidImageUrl('https://s3.amazonaws.com/...')` → `false`
- ❌ `processImageUrl` 使用 fallback 圖片
- ❌ Next.js Image 無法加載圖片
- ❌ 前端顯示 fallback 圖片

### 修復後
- ✅ `isValidImageUrl('https://s3.amazonaws.com/...')` → `true`
- ✅ `processImageUrl` 使用真正的圖片URL
- ✅ Next.js Image 可以加載圖片
- ✅ 前端顯示真正的圖片

---

## 📋 驗證步驟

### 1. 檢查數據庫

確認圖片URL已更新：
```sql
SELECT id, nameZh, mainImageUrl FROM wines WHERE id = 'wine_staglin_salus_2018';
SELECT id, nameZh, logoUrl FROM wineries WHERE id = 'winery_staglin';
```

### 2. 檢查前端

1. **清除瀏覽器緩存**
   - 按 `Ctrl + Shift + R` 強制刷新
   - 或清除瀏覽器緩存

2. **檢查控制台**
   - 打開瀏覽器開發者工具
   - 查看 Network 標籤
   - 確認圖片請求是否成功

3. **檢查圖片URL**
   - 在瀏覽器中直接打開圖片URL
   - 確認圖片可以正常顯示

### 3. 檢查代碼

確認以下文件已更新：
- ✅ `lib/utils/image-utils.ts` - 添加了 `s3.amazonaws.com`
- ✅ `next.config.js` - 添加了 `s3.amazonaws.com` 到 `remotePatterns`

---

## 🔄 如果還是不顯示

### 可能原因

1. **瀏覽器緩存**
   - 解決：強制刷新（`Ctrl + Shift + R`）

2. **Next.js 緩存**
   - 解決：重啟開發服務器
   - 解決：刪除 `.next` 文件夾

3. **圖片URL無效**
   - 解決：在瀏覽器中直接打開URL檢查
   - 解決：檢查圖片服務器是否可訪問

4. **CORS 問題**
   - 解決：檢查圖片服務器的 CORS 設置
   - 解決：使用代理或 CDN

### 調試步驟

1. **檢查 Network 請求**
   ```
   打開瀏覽器開發者工具 → Network 標籤
   查看圖片請求的狀態碼
   - 200: 成功
   - 403/404: 圖片URL無效或需要認證
   - CORS錯誤: 需要配置CORS
   ```

2. **檢查控制台錯誤**
   ```
   打開瀏覽器開發者工具 → Console 標籤
   查看是否有圖片加載錯誤
   ```

3. **檢查圖片URL**
   ```
   在瀏覽器中直接打開圖片URL
   確認圖片是否可以正常顯示
   ```

---

## 📝 相關文件

- `lib/utils/image-utils.ts` - 圖片驗證和處理邏輯
- `next.config.js` - Next.js Image 配置
- `app/page.tsx` - 首頁數據獲取和處理
- `components/WineCard.tsx` - 酒款卡片組件
- `components/WineryCard.tsx` - 酒莊卡片組件

---

## ✅ 修復狀態

- ✅ 已更新 `lib/utils/image-utils.ts`
- ✅ 已更新 `next.config.js`
- ⏳ 需要重啟開發服務器
- ⏳ 需要清除瀏覽器緩存

---

**下一步：** 重啟開發服務器並清除瀏覽器緩存，然後檢查圖片是否正常顯示。

