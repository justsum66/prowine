/**
 * 企業級：統一的 API 類型定義
 * 消除重複的類型定義，提高代碼可維護性
 */

// Supabase 錯誤類型
export interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Wine 數據類型
export interface WineData {
  id: string;
  slug: string;
  nameZh: string;
  nameEn?: string;
  descriptionZh?: string;
  descriptionEn?: string;
  category: string;
  region?: string;
  country?: string;
  vintage?: number;
  price: number | string;
  mainImageUrl?: string;
  images?: unknown;
  ratings?: {
    decanter?: number;
    jamesSuckling?: number;
    robertParker?: number;
  } | null;
  featured: boolean;
  bestseller: boolean;
  published: boolean;
  wineryId: string;
  winery?: {
    id: string;
    nameZh?: string;
    nameEn?: string;
    slug?: string;
    website?: string;
  } | null;
}

// Winery 數據類型
export interface WineryData {
  id: string;
  nameZh: string;
  nameEn?: string;
  slug: string;
  descriptionZh?: string;
  descriptionEn?: string;
  region?: string;
  country?: string;
  website?: string;
  logoUrl?: string;
  images?: unknown;
  featured: boolean;
  createdAt: string;
}

