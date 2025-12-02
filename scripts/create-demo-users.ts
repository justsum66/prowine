/**
 * 創建 DEMO 用戶腳本
 * 使用 Supabase Admin API 創建測試用戶
 * 
 * 注意：需要在 Supabase Dashboard 中手動創建用戶，或使用 Supabase Management API
 * 這個腳本提供 SQL 指令，可以在 Supabase Dashboard 的 SQL Editor 中執行
 */

// 由於 Supabase Auth 用戶需要通過 Supabase Dashboard 或 Management API 創建
// 這裡提供 SQL 指令用於在 Supabase Dashboard 中執行

export const createUsersSQL = `
-- 注意：Supabase Auth 用戶需要通過 Supabase Dashboard 或 Management API 創建
-- 以下是創建用戶的步驟：

-- 1. 在 Supabase Dashboard > Authentication > Users 中手動創建用戶
--    或使用 Supabase Management API

-- 2. 創建用戶後，在 users 表中創建對應記錄（如果不存在）

-- Admin 用戶（需要在 Supabase Auth 中創建）
-- Email: admin@prowine.com.tw
-- Password: prowine123456
-- 然後執行：
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
ON CONFLICT (id) DO NOTHING;

-- B2C 用戶
-- Email: b2c@prowine.com.tw
-- Password: prowine123456
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
ON CONFLICT (id) DO NOTHING;

-- B2B 用戶
-- Email: b2b@prowine.com.tw
-- Password: prowine123456
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
ON CONFLICT (id) DO NOTHING;

-- 創建 Admin 記錄（如果使用 admins 表）
INSERT INTO admins (id, email, name, "passwordHash", role, active)
VALUES (
  'admin_001',
  'admin@prowine.com.tw',
  '系統管理員',
  '$2a$10$placeholder', -- 實際應該使用正確的 bcrypt hash
  'SUPER_ADMIN',
  true
)
ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  active = true;
`;

console.log('請在 Supabase Dashboard > Authentication > Users 中手動創建用戶');
console.log('然後執行上面的 SQL 指令來創建對應的 users 表記錄');

