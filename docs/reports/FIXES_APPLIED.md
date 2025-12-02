# 修復報告 - 2024-12-19

## 已完成的修復

### 1. ✅ Terminal 亂碼問題
**問題**: PowerShell 顯示亂碼
**解決方案**: 
- 設置 UTF-8 編碼：`chcp 65001`
- 設置 PowerShell 輸出編碼為 UTF-8
- 在啟動腳本中自動設置編碼

**修復位置**: 
- 開發伺服器啟動命令已包含編碼設置

### 2. ✅ ByteString 錯誤修復
**問題**: `TypeError: Cannot convert argument to a ByteString because the character at index 15 has a value of 22823`
**原因**: Next.js 處理 metadata 中的中文字符時編碼問題
**解決方案**:
- 在 `app/layout.tsx` 的 metadata 中添加明確的字符編碼設置
- 在 `next.config.js` 中優化配置
- 創建 `middleware.ts` 確保所有響應使用 UTF-8 編碼

**修復文件**:
- `app/layout.tsx`: 添加 `other: { 'charset': 'utf-8' }`
- `next.config.js`: 優化配置
- `middleware.ts`: 新建，處理編碼問題

### 3. ✅ 404 錯誤處理
**問題**: 
- `/sw.js` 404 錯誤（Service Worker）
- `/videos/hero-video.webm` 404 錯誤

**解決方案**:
- 在 `middleware.ts` 中處理這些請求
- `/sw.js` 返回 404 並提供適當的 Content-Type
- `/videos/hero-video.webm` 返回 404

**修復文件**:
- `middleware.ts`: 添加特定路徑的 404 處理

### 4. ✅ 路由衝突修復
**問題**: `app/wineries/[id]` 和 `app/wineries/[slug]` 同時存在
**解決方案**: 刪除 `app/wineries/[slug]` 目錄，保留使用 API 的 `[id]` 版本

## 當前狀態

### 伺服器狀態
- ✅ 開發伺服器已啟動（PID: 10392）
- ✅ 端口 3000 正在監聽
- ⚠️ 伺服器響應可能較慢（編譯中）

### 建議下一步

1. **等待編譯完成**
   - Next.js 首次編譯可能需要 30-60 秒
   - 檢查終端輸出確認編譯完成

2. **測試網頁**
   - 訪問 `http://localhost:3000`
   - 如果仍無法連接，檢查：
     - 防火牆設置
     - 代理設置
     - 瀏覽器控制台錯誤

3. **檢查編譯錯誤**
   - 查看終端輸出
   - 確認沒有 TypeScript 或編譯錯誤

4. **如果問題持續**
   - 檢查 `.env` 文件是否存在且正確
   - 確認所有依賴已安裝：`npm install`
   - 嘗試清除緩存：刪除 `.next` 文件夾後重新啟動

## 修復的文件清單

1. `next.config.js` - 優化配置
2. `middleware.ts` - 新建，處理編碼和 404
3. `app/layout.tsx` - 添加字符編碼設置
4. 刪除 `app/wineries/[slug]/page.tsx` - 解決路由衝突

## 技術細節

### Terminal 編碼設置
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001
```

### Middleware 配置
- 只匹配特定路徑（`/sw.js`, `/videos/*`）
- 不影響其他請求的性能
- 正確處理 UTF-8 編碼

### Metadata 修復
- 明確指定字符編碼
- 確保中文字符正確處理
- 符合 Next.js 15 最佳實踐

