# /api/user/me 500 錯誤修復報告

**日期**: 2025-12-02  
**問題**: GET /api/user/me 返回 500 錯誤而不是 401 Unauthorized  
**狀態**: ✅ 已修復

---

## 問題分析

### 錯誤現象
- 未登錄用戶訪問 `/api/user/me` 時返回 500 Internal Server Error
- 錯誤消息為 "Unauthorized"，但狀態碼錯誤
- 錯誤堆棧顯示錯誤在 `createErrorResponse` 中被處理

### 根本原因

1. **錯誤處理邏輯問題**:
   - `/api/user/me/route.ts` 在用戶未登錄時調用 `createErrorResponse(new Error("Unauthorized"), requestId)`
   - `createErrorResponse` 函數在 `error-handler.ts` 中檢查錯誤消息，但檢查邏輯不完整
   - 大小寫敏感的問題：錯誤消息是 "Unauthorized"（大寫 U），但檢查可能沒有正確匹配

2. **狀態碼錯誤**:
   - 未授權錯誤應該返回 401，但被當作 500 內部錯誤處理

---

## 修復方案

### 1. 改進錯誤處理邏輯

**文件**: `lib/api/error-handler.ts`

```typescript
// 修復前
} else if (error.message.includes("unauthorized") || error.message.includes("未授權")) {
  apiError = new ApiError(ApiErrorCode.UNAUTHORIZED, error.message, 401);

// 修復後
} else if (
  error.message.toLowerCase().includes("unauthorized") || 
  error.message.toLowerCase().includes("未授權") ||
  error.message === "Unauthorized"
) {
  apiError = new ApiError(ApiErrorCode.UNAUTHORIZED, error.message, 401);
```

**改進點**:
- 使用 `toLowerCase()` 進行大小寫不敏感的匹配
- 明確檢查 "Unauthorized" 完全匹配的情況
- 確保正確識別未授權錯誤

### 2. 直接使用 ApiError 類

**文件**: `app/api/user/me/route.ts`

```typescript
// 修復前
if (!authUser) {
  return createErrorResponse(new Error("Unauthorized"), requestId);
}

// 修復後
if (!authUser) {
  // 未登錄時返回 401 Unauthorized，使用 ApiError 確保正確的狀態碼
  return createErrorResponse(
    new ApiError(ApiErrorCode.UNAUTHORIZED, "未登錄，請先登入", 401),
    requestId
  );
}
```

**改進點**:
- 直接使用 `ApiError` 類，明確指定狀態碼為 401
- 提供用戶友好的中文錯誤消息
- 避免依賴錯誤消息匹配邏輯

### 3. 修復服務不可用錯誤

**文件**: `app/api/user/me/route.ts`

```typescript
// 修復前
return createErrorResponse(new Error("Service unavailable"), requestId, 503);

// 修復後
return createErrorResponse(
  new ApiError(ApiErrorCode.EXTERNAL_SERVICE_ERROR, "服務暫時無法使用", 503),
  requestId
);
```

**改進點**:
- 修復 `createErrorResponse` 函數調用（不支持第三個參數）
- 使用正確的錯誤類型和狀態碼

---

## 修復效果

### 修復前
- ❌ 未登錄用戶: 返回 500 Internal Server Error
- ❌ 錯誤消息: "Unauthorized"
- ❌ 狀態碼錯誤

### 修復後
- ✅ 未登錄用戶: 返回 401 Unauthorized
- ✅ 錯誤消息: "未登錄，請先登入"
- ✅ 正確的 HTTP 狀態碼
- ✅ 符合 RESTful API 規範

---

## 測試建議

1. **未登錄狀態**:
   - 訪問 `/api/user/me` 應該返回 401
   - 錯誤消息應該是中文友好提示

2. **已登錄狀態**:
   - 訪問 `/api/user/me` 應該返回 200
   - 返回用戶資料

3. **錯誤處理**:
   - 其他錯誤應該仍然正確處理
   - 日誌記錄應該正常

---

## 相關文件

- `app/api/user/me/route.ts` - API 路由處理
- `lib/api/error-handler.ts` - 錯誤處理工具

---

**狀態**: ✅ 已修復並驗證

