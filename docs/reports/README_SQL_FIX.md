# SQL 腳本修復說明

## ✅ 已修復

修復了 `updatedAt` 欄位不能為 null 的錯誤。

### 修改內容

1. **明確設置 `createdAt` 和 `updatedAt`**：
   - 使用 `CURRENT_TIMESTAMP` 設置時間戳
   - 確保插入時兩個欄位都有值

2. **ON CONFLICT 時更新 `updatedAt`**：
   - 在衝突更新時，明確設置 `updatedAt = CURRENT_TIMESTAMP`

### 修復後的 SQL

```sql
INSERT INTO admins (id, email, name, "passwordHash", role, active, "createdAt", "updatedAt")
VALUES (
  '8456268a-3053-4205-a53a-7d6cc385f16f',
  'admin@prowine.com.tw',
  '系統管理員',
  '$2a$10$placeholder',
  'SUPER_ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  active = true,
  "updatedAt" = CURRENT_TIMESTAMP;
```

---

## 📝 執行步驟

1. 打開 Supabase Dashboard
2. 前往 SQL Editor
3. 執行 `scripts/setup-admin.sql` 中的 SQL 語句
4. 驗證執行結果

---

## ✅ 驗證

執行後，使用以下 SQL 驗證：

```sql
SELECT 
  id,
  email,
  name,
  role,
  active,
  "createdAt",
  "updatedAt",
  "lastLoginAt"
FROM admins
WHERE email = 'admin@prowine.com.tw';
```

應該看到一條記錄，所有欄位都有值（`lastLoginAt` 可能是 null，這是正常的）。

