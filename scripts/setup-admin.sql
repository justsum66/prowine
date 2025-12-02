-- 設置管理員帳號
-- 在 Supabase Dashboard > SQL Editor 中執行此腳本

-- 管理員資訊
-- Email: admin@prowine.com.tw
-- UID: 8456268a-3053-4205-a53a-7d6cc385f16f

-- 1. 確保 admins 表中有管理員記錄
-- 注意：如果 updatedAt 有 @updatedAt 約束，PostgreSQL 會自動更新，但插入時仍需提供值
INSERT INTO admins (id, email, name, "passwordHash", role, active, "createdAt", "updatedAt")
VALUES (
  '8456268a-3053-4205-a53a-7d6cc385f16f',
  'admin@prowine.com.tw',
  '系統管理員',
  '$2a$10$placeholder', -- 使用 Supabase Auth，此處為占位符
  'SUPER_ADMIN',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO UPDATE SET
  role = 'SUPER_ADMIN',
  active = true,
  "updatedAt" = CURRENT_TIMESTAMP;

-- 2. 驗證設置
SELECT 
  id,
  email,
  name,
  role,
  active,
  "createdAt",
  "lastLoginAt"
FROM admins
WHERE email = 'admin@prowine.com.tw';

