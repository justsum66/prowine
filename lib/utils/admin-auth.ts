/**
 * 後台管理員認證工具
 * 使用 Supabase Auth + Admin 表角色檢查
 */

import { createClient } from "@/lib/supabase/server";
import { createServerSupabaseClient } from "@/lib/supabase/client";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "CUSTOMER_SERVICE";
  active: boolean;
}

/**
 * 檢查用戶是否為管理員
 */
export async function checkAdminAuth(): Promise<AdminUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
      return null;
    }

    // 使用 Supabase 檢查 Admin 表中是否存在該用戶
    const serverSupabase = createServerSupabaseClient();
    const { data: admin, error } = await serverSupabase
      .from("admins")
      .select("id, email, name, role, active")
      .eq("email", authUser.email)
      .eq("active", true)
      .single();

    if (error || !admin) {
      return null;
    }

    // 更新最後登入時間
    await serverSupabase
      .from("admins")
      .update({ lastLoginAt: new Date().toISOString() })
      .eq("id", admin.id);

    return admin as AdminUser;
  } catch (error) {
    console.error("Admin auth check error:", error);
    return null;
  }
}

/**
 * 檢查管理員權限
 */
export function hasPermission(
  admin: AdminUser | null,
  requiredRole: "SUPER_ADMIN" | "ADMIN" | "EDITOR" | "CUSTOMER_SERVICE"
): boolean {
  if (!admin || !admin.active) {
    return false;
  }

  const roleHierarchy = {
    SUPER_ADMIN: 4,
    ADMIN: 3,
    EDITOR: 2,
    CUSTOMER_SERVICE: 1,
  };

  return roleHierarchy[admin.role] >= roleHierarchy[requiredRole];
}

/**
 * 創建審計日誌
 */
export async function createAuditLog(
  adminId: string,
  action: string,
  entity: string,
  entityId: string | null = null,
  changes: any = null,
  request?: Request
) {
  try {
    const ipAddress = request?.headers.get("x-forwarded-for") || request?.headers.get("x-real-ip") || null;
    const userAgent = request?.headers.get("user-agent") || null;

    const serverSupabase = createServerSupabaseClient();
    await serverSupabase.from("audit_logs").insert({
      adminId,
      action,
      entity,
      entityId,
      changes: changes ? JSON.parse(JSON.stringify(changes)) : null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // 不阻止操作，僅記錄錯誤
  }
}

