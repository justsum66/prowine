# 企業級安全文檔

本文檔詳細說明了 ProWine 項目實施的所有安全措施。

## 目錄

1. [安全標頭](#安全標頭)
2. [CSRF 防護](#csrf-防護)
3. [速率限制](#速率限制)
4. [輸入驗證和清理](#輸入驗證和清理)
5. [認證和授權](#認證和授權)
6. [API 安全](#api-安全)
7. [錯誤處理](#錯誤處理)
8. [日誌安全](#日誌安全)
9. [環境變數安全](#環境變數安全)
10. [依賴項安全](#依賴項安全)

## 安全標頭

### 實施的安全標頭

- **Content-Security-Policy (CSP)**: 防止 XSS 攻擊
- **Strict-Transport-Security (HSTS)**: 強制 HTTPS 連接
- **X-Frame-Options**: 防止點擊劫持
- **X-Content-Type-Options**: 防止 MIME 類型嗅探
- **X-XSS-Protection**: 舊版瀏覽器 XSS 防護
- **Referrer-Policy**: 控制 referrer 信息
- **Permissions-Policy**: 控制瀏覽器功能

### 使用方式

安全標頭通過 `middleware.ts` 自動應用到所有響應。配置位於 `lib/security/security-headers.ts`。

## CSRF 防護

### 實施方式

- 使用雙重提交 Cookie 模式
- Token 存儲在 HttpOnly Cookie 中
- 時間安全的字符串比較防止時間攻擊

### 使用方式

```typescript
import { withCSRFProtection } from "@/lib/security/csrf-middleware";

export async function POST(request: NextRequest) {
  return withCSRFProtection(request, async (req) => {
    // 您的處理邏輯
  });
}
```

## 速率限制

### 限制級別

1. **默認限制**: 30 次請求/分鐘
2. **嚴格限制**: 5 次請求/分鐘（用於敏感操作）
3. **極嚴格限制**: 3 次請求/15 分鐘（用於登入、註冊）
4. **管理員限制**: 20 次請求/分鐘
5. **API 限制**: 100 次請求/分鐘

### 使用方式

```typescript
import { rateLimiter, strictRateLimit } from "@/lib/api/rate-limiter";

// 在 API 路由中
rateLimiter.check(request, strictRateLimit);
```

## 輸入驗證和清理

### Zod 驗證

所有 API 端點使用 Zod 進行輸入驗證。驗證模式定義在 `lib/api/zod-schemas.ts`。

### 輸入清理

提供多種清理函數：

- `sanitizeHtml()`: 清理 HTML，防止 XSS
- `sanitizeSql()`: 清理 SQL 注入攻擊
- `sanitizePath()`: 清理路徑遍歷攻擊
- `sanitizeUrl()`: 驗證和清理 URL
- `sanitizeEmail()`: 驗證和清理電子郵件
- `sanitizeObject()`: 遞歸清理對象

### 使用方式

```typescript
import { sanitizeHtml, sanitizeEmail } from "@/lib/security/input-sanitizer";

const cleanInput = sanitizeHtml(userInput);
const cleanEmail = sanitizeEmail(emailInput);
```

## 認證和授權

### 密碼策略

- 最小長度: 8 個字符
- 必須包含: 大寫字母、小寫字母、數字、特殊字符
- 強度評分: 0-4（建議至少 3）

### 帳戶鎖定

- 最大失敗嘗試: 5 次
- 鎖定時間: 15 分鐘
- 重置窗口: 1 小時

### 會話管理

- 會話最大存活時間: 7 天
- 使用 HttpOnly、Secure、SameSite=Strict Cookie
- 自動刷新機制

### 使用方式

```typescript
import { validatePasswordStrength } from "@/lib/security/auth-hardening";
import { accountLockoutManager } from "@/lib/security/auth-hardening";

// 驗證密碼強度
const result = validatePasswordStrength(password);

// 檢查帳戶鎖定
const lockoutInfo = accountLockoutManager.getLockoutInfo(email);
```

## API 安全

### API Key 驗證

支持 API Key 驗證，可配置權限和速率限制。

### 請求簽名

支持 HMAC-SHA256 請求簽名驗證。

### IP 白名單/黑名單

支持 IP 白名單和黑名單管理。

### 使用方式

```typescript
import { validateApiSecurity } from "@/lib/security/api-security";

const result = await validateApiSecurity(request, {
  requireApiKey: true,
  requireSignature: true,
  checkIPWhitelist: true,
  apiSecret: process.env.API_SECRET,
});
```

## 錯誤處理

### 安全特性

- 生產環境不洩露敏感信息
- 自動過濾密碼、令牌、API keys
- 統一的錯誤響應格式
- 請求 ID 追蹤

### 使用方式

```typescript
import { createErrorResponse } from "@/lib/api/error-handler";

try {
  // 您的邏輯
} catch (error) {
  return createErrorResponse(error, requestId);
}
```

## 日誌安全

### 自動清理

所有日誌自動清理敏感信息：

- 密碼
- API keys
- 令牌
- 信用卡信息
- 其他敏感字段

### 使用方式

```typescript
import { sanitizeLogObject } from "@/lib/security/log-sanitizer";
import { logger } from "@/lib/api/logger";

logger.error("錯誤消息", error, sanitizeLogObject(context));
```

## 環境變數安全

### 驗證

所有環境變數在啟動時驗證：

- 類型檢查
- 格式驗證
- 長度檢查
- 模式匹配

### 安全檢查

運行安全檢查腳本：

```bash
npm run security-check
```

### 環境變數文件

- **`.env.example`**: 安全的模板文件（不包含真實 keys）
- **`.env`**: 實際環境變數（不應提交到版本控制）

⚠️ **重要**: `env.template` 文件包含真實的 API keys，應立即移除或重置所有 keys。

## 依賴項安全

### 檢查方式

1. 運行 `npm audit` 檢查已知漏洞
2. 使用 `npm audit fix` 自動修復
3. 定期更新依賴項

### 建議

- 定期檢查和更新依賴項
- 使用 `package-lock.json` 鎖定版本
- 審查新添加的依賴項

## 安全最佳實踐

### 開發階段

1. ✅ 使用 `.env.example` 作為模板
2. ✅ 永遠不要提交真實的 API keys
3. ✅ 使用 HTTPS 進行本地開發
4. ✅ 定期運行安全檢查

### 生產環境

1. ✅ 使用強密碼和 API keys
2. ✅ 啟用所有安全標頭
3. ✅ 配置適當的速率限制
4. ✅ 監控異常活動
5. ✅ 定期審計和更新

### 應急響應

如果發現安全漏洞：

1. 立即重置所有受影響的 API keys
2. 檢查日誌中的異常活動
3. 通知相關團隊
4. 修復漏洞並部署更新
5. 進行安全審計

## 安全檢查清單

- [x] 安全標頭已實施
- [x] CSRF 防護已啟用
- [x] 速率限制已配置
- [x] 輸入驗證使用 Zod
- [x] 輸入清理已實施
- [x] 密碼策略已配置
- [x] 帳戶鎖定已啟用
- [x] 錯誤處理不洩露敏感信息
- [x] 日誌自動清理敏感信息
- [x] 環境變數驗證已實施
- [ ] 依賴項安全檢查（需要定期運行）

## 聯繫方式

如有安全問題，請聯繫：security@prowine.com.tw

---

**最後更新**: 2024年

