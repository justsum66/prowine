-- 創建管理員通知表
CREATE TABLE IF NOT EXISTS admin_notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  adminId TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT admin_notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'error'))
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_admin_notifications_adminId ON admin_notifications(adminId);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_createdAt ON admin_notifications(createdAt DESC);

-- 添加註釋
COMMENT ON TABLE admin_notifications IS '管理員通知表';
COMMENT ON COLUMN admin_notifications.type IS '通知類型：info, success, warning, error';
COMMENT ON COLUMN admin_notifications.read IS '是否已讀';

