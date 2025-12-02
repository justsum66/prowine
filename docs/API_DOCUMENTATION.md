# ProWine API 文檔

## 概述

ProWine API 提供 RESTful 接口，用於訪問酒款、酒莊和其他資源。

**Base URL**: `https://prowine.com.tw/api`

**認證**: 大部分端點需要認證，使用 Bearer Token。

---

## 通用響應格式

### 成功響應

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2024-12-02T10:00:00.000Z"
}
```

### 錯誤響應

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "資源不存在",
    "details": { ... },
    "timestamp": "2024-12-02T10:00:00.000Z",
    "requestId": "req_1234567890_abc123"
  }
}
```

---

## 錯誤代碼

| 代碼 | HTTP 狀態碼 | 說明 |
|------|------------|------|
| `BAD_REQUEST` | 400 | 請求參數錯誤 |
| `UNAUTHORIZED` | 401 | 未授權 |
| `FORBIDDEN` | 403 | 禁止訪問 |
| `NOT_FOUND` | 404 | 資源不存在 |
| `VALIDATION_ERROR` | 400 | 驗證失敗 |
| `RATE_LIMIT_EXCEEDED` | 429 | 請求過於頻繁 |
| `INTERNAL_ERROR` | 500 | 伺服器內部錯誤 |
| `DATABASE_ERROR` | 500 | 資料庫錯誤 |

---

## 速率限制

所有 API 端點都有速率限制：

- **一般 API**: 每分鐘 60 次請求
- **認證 API**: 每分鐘 5 次請求
- **搜索 API**: 每分鐘 30 次請求
- **表單提交**: 每小時 10 次

超過限制時，響應包含以下頭部：
- `X-RateLimit-Limit`: 限制數量
- `X-RateLimit-Remaining`: 剩餘請求數
- `X-RateLimit-Reset`: 重置時間（Unix 時間戳）
- `Retry-After`: 重試等待時間（秒）

---

## 端點

### 酒款 API

#### 獲取酒款列表

```
GET /api/wines
```

**查詢參數**:
- `page` (number): 頁碼，默認 1
- `limit` (number): 每頁數量，默認 20，最大 100
- `search` (string): 搜索關鍵字
- `region` (string): 產區
- `country` (string): 國家
- `minPrice` (number): 最低價格
- `maxPrice` (number): 最高價格
- `vintage` (number): 年份
- `featured` (boolean): 是否精選
- `bestseller` (boolean): 是否熱銷
- `published` (boolean): 是否已發布

**響應示例**:
```json
{
  "success": true,
  "data": {
    "wines": [
      {
        "id": "1",
        "slug": "test-wine",
        "nameZh": "測試酒款",
        "nameEn": "Test Wine",
        "wineryName": "測試酒莊",
        "price": 1000,
        "imageUrl": "https://...",
        "region": "波爾多",
        "vintage": 2020,
        "rating": 95
      }
    ],
    "total": 100
  }
}
```

#### 獲取酒款詳情

```
GET /api/wines/:slug
```

**路徑參數**:
- `slug` (string): 酒款 slug 或 ID

**響應示例**:
```json
{
  "success": true,
  "data": {
    "wine": {
      "id": "1",
      "slug": "test-wine",
      "nameZh": "測試酒款",
      "nameEn": "Test Wine",
      "description": "詳細描述...",
      "price": 1000,
      "stock": 10,
      "images": ["https://..."],
      "winery": { ... },
      "ratings": { ... }
    }
  }
}
```

### 酒莊 API

#### 獲取酒莊列表

```
GET /api/wineries
```

**查詢參數**: 與酒款列表類似

#### 獲取酒莊詳情

```
GET /api/wineries/:slug
```

### 購物車 API

#### 獲取購物車

```
GET /api/cart
```

**認證**: 需要

**響應示例**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1",
        "wineId": "wine-1",
        "nameZh": "測試酒款",
        "quantity": 2,
        "price": 1000
      }
    ],
    "total": 2000
  }
}
```

#### 添加商品到購物車

```
POST /api/cart
```

**請求體**:
```json
{
  "wineId": "wine-1",
  "quantity": 1
}
```

#### 更新購物車商品

```
PUT /api/cart/:wineId
```

#### 刪除購物車商品

```
DELETE /api/cart/:wineId
```

### 願望清單 API

#### 獲取願望清單

```
GET /api/wishlist
```

#### 添加到願望清單

```
POST /api/wishlist
```

**請求體**:
```json
{
  "wineId": "wine-1"
}
```

#### 從願望清單移除

```
DELETE /api/wishlist/:wineId
```

---

## 認證

### 登入

```
POST /api/auth/login
```

**請求體**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**響應**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt-token-here"
  }
}
```

### 註冊

```
POST /api/auth/register
```

### Google OAuth

```
GET /api/auth/google
```

重定向到 Google 登入頁面。

---

## 最佳實踐

1. **使用 HTTPS**: 所有請求必須使用 HTTPS
2. **處理錯誤**: 始終檢查 `success` 字段
3. **速率限制**: 遵守速率限制，使用 `Retry-After` 頭部
4. **緩存**: 適當緩存響應以減少請求
5. **分頁**: 使用分頁參數處理大量數據

---

## 更新日誌

- **2024-12-02**: 初始版本
- 添加速率限制
- 添加錯誤追蹤（Sentry）

