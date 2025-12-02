import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * 創建 Supabase 客戶端（用於客戶端組件）
 * 這是一個函數，每次調用返回新的客戶端實例
 * 用於在客戶端組件中創建 Supabase 客戶端
 */
export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }
  
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// 單例 Supabase 客戶端（用於直接使用）
export const supabase = createClient();

/**
 * 服務端 Supabase 客戶端（用於 API 路由和 Server Components）
 * 優先使用 Service Role Key 以獲得完整權限（繞過 RLS）
 * 如果沒有 Service Role Key，使用 Anon Key（受 RLS 限制）
 */
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  
  // 優先使用 Service Role Key（繞過 RLS）
  const apiKey = serviceRoleKey || anonKey;
  
  if (!apiKey) {
    throw new Error("Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set");
  }
  
  // 開發環境才輸出調試信息
  if (process.env.NODE_ENV === 'development' && process.env.DEBUG_SUPABASE === 'true') {
    console.log("Creating Supabase client:", {
      url: supabaseUrl,
      usingServiceRole: !!serviceRoleKey,
      keyLength: apiKey.length,
    });
  }
  
  return createSupabaseClient(supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
