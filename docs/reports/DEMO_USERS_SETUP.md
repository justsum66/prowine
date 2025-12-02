# DEMO 用戶設置指南

## 📋 測試賬號信息

### 後台管理員賬號
- **Email:** admin@prowine.com.tw
- **密碼:** prowine123456
- **權限:** SUPER_ADMIN（所有權限）

### B2C 模擬會員賬號
- **Email:** b2c@prowine.com.tw
- **密碼:** prowine123456
- **會員等級:** VIP

### B2B 模擬會員賬號
- **Email:** b2b@prowine.com.tw
- **密碼:** prowine123456
- **會員等級:** PREMIUM

---

## 🔧 設置步驟

### 方法 1: 使用 Supabase Dashboard（推薦）

1. 登入 Supabase Dashboard: https://supabase.com/dashboard
2. 選擇您的項目
3. 前往 **Authentication > Users**
4. 點擊 **Add User** 或 **Invite User**
5. 為每個測試賬號創建用戶：
   - 輸入 Email
   - 輸入密碼（prowine123456）
   - 點擊 **Create User**

### 方法 2: 使用 Supabase CLI

```bash
# 安裝 Supabase CLI（如果尚未安裝）
npm install -g supabase

# 登入 Supabase
supabase login

# 創建用戶（需要在項目目錄中）
supabase auth users create admin@prowine.com.tw --password prowine123456
supabase auth users create b2c@prowine.com.tw --password prowine123456
supabase auth users create b2b@prowine.com.tw --password prowine123456
```

### 方法 3: 使用 Supabase Management API

```typescript
// 使用 Supabase Management API 創建用戶
// 需要 SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 創建用戶
await supabaseAdmin.auth.admin.createUser({
  email: 'admin@prowine.com.tw',
  password: 'prowine123456',
  email_confirm: true,
});

await supabaseAdmin.auth.admin.createUser({
  email: 'b2c@prowine.com.tw',
  password: 'prowine123456',
  email_confirm: true,
});

await supabaseAdmin.auth.admin.createUser({
  email: 'b2b@prowine.com.tw',
  password: 'prowine123456',
  email_confirm: true,
});
```

---

## ✅ 驗證設置

創建用戶後，系統會自動在 `users` 表中創建對應記錄（通過 `app/api/user/me/route.ts` 的邏輯）。

如果用戶記錄未自動創建，可以手動執行以下 SQL（在 Supabase Dashboard > SQL Editor 中）：

```sql
-- 為已創建的 Auth 用戶創建對應的 users 表記錄
-- 注意：需要先確認 auth.users 表中已有對應記錄

-- Admin 用戶
INSERT INTO users (id, email, name, "membershipLevel", "emailVerified", active)
SELECT 
  auth.uid,
  'admin@prowine.com.tw',
  '系統管理員',
  'PREMIUM',
  true,
  true
FROM auth.users
WHERE auth.email = 'admin@prowine.com.tw'
ON CONFLICT (id) DO UPDATE SET
  "membershipLevel" = 'PREMIUM',
  active = true;

-- B2C 用戶
INSERT INTO users (id, email, name, "membershipLevel", "emailVerified", active)
SELECT 
  auth.uid,
  'b2c@prowine.com.tw',
  'B2C 測試用戶',
  'VIP',
  true,
  true
FROM auth.users
WHERE auth.email = 'b2c@prowine.com.tw'
ON CONFLICT (id) DO UPDATE SET
  "membershipLevel" = 'VIP',
  active = true;

-- B2B 用戶
INSERT INTO users (id, email, name, "membershipLevel", "emailVerified", active)
SELECT 
  auth.uid,
  'b2b@prowine.com.tw',
  'B2B 測試用戶',
  'PREMIUM',
  true,
  true
FROM auth.users
WHERE auth.email = 'b2b@prowine.com.tw'
ON CONFLICT (id) DO UPDATE SET
  "membershipLevel" = 'PREMIUM',
  active = true;
```

---

## 📝 注意事項

1. **Supabase Auth 用戶必須先創建**：`users` 表的記錄依賴於 `auth.users` 表中的記錄
2. **Email 驗證**：測試環境中，建議在 Supabase Dashboard 中手動驗證用戶 Email
3. **Admin 角色**：`admins` 表的記錄需要單獨創建（如果使用後台管理系統）
4. **密碼安全**：這些是測試賬號，生產環境請使用強密碼

---

## 🧪 測試登入

創建用戶後，可以在網站上測試登入：

1. 前往登入頁面（如果有的話）
2. 輸入 Email 和密碼
3. 確認可以成功登入並看到對應的會員等級

---

**設置完成後，所有測試賬號都可以正常使用！**

