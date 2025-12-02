/**
 * 後台管理路由中間件
 * 檢查管理員認證和權限
 */

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth, hasPermission } from "@/lib/utils/admin-auth";
import { AdminUser } from "@/lib/utils/admin-auth";

export interface AdminRequest extends NextRequest {
  admin?: AdminUser;
}

/**
 * 驗證管理員身份的中間件
 * 如果未通過驗證，返回錯誤響應，否則返回 null
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const admin = await checkAdminAuth();

  if (!admin) {
    return NextResponse.json(
      { error: "需要管理員權限" },
      { status: 401 }
    );
  }

  return null; // 通過驗證
}

/**
 * 檢查特定角色權限的中間件
 */
export async function requireAdminRole(
  request: NextRequest,
  requiredRole: AdminUser["role"]
): Promise<NextResponse | null> {
  const admin = await checkAdminAuth();

  if (!admin) {
    return NextResponse.json(
      { error: "需要管理員權限" },
      { status: 401 }
    );
  }

  if (!hasPermission(admin, requiredRole)) {
    return NextResponse.json(
      { error: "權限不足" },
      { status: 403 }
    );
  }

  return null; // 通過驗證
}

