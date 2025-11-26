export interface Winery {
  id: string
  name: string
  slug: string
  logo_url?: string
  hero_image_url?: string
  region: string
  country: string
  established?: number
  story?: string
  description?: string
  acreage?: number
  awards_count?: number
  website_url?: string
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
}

export interface Wine {
  id: string
  winery_id: string
  name: string
  slug: string
  vintage?: number
  varietal: string
  price: number
  original_price?: number
  image_url: string
  gallery_urls?: string[]
  alcohol_content?: number
  volume: number
  tasting_notes?: string
  food_pairing?: string[]
  serving_temperature?: string
  aging_potential?: string
  wine_type: 'red' | 'white' | 'sparkling' | 'rose' | 'dessert'
  wine_style?: string
  region?: string
  appellation?: string
  stock: number
  is_limited: boolean
  is_featured: boolean
  is_available: boolean
  awards?: string[]
  ratings?: Array<{ source: string; score: number }>
  meta_title?: string
  meta_description?: string
  created_at: string
  updated_at: string
  winery?: Winery
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string
  content: string
  featured_image_url?: string
  category?: string
  tags?: string[]
  meta_title?: string
  meta_description?: string
  status: 'draft' | 'published'
  published_at?: string
  created_at: string
  updated_at: string
}

export interface Inquiry {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  wine_ids?: string[]
  message?: string
  inquiry_type: 'product' | 'bulk' | 'general'
  status: 'pending' | 'contacted' | 'quoted' | 'closed'
  admin_note?: string
  created_at: string
  updated_at: string
}

