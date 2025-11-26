-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wineries Table (酒莊)
CREATE TABLE IF NOT EXISTS wineries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  hero_image_url TEXT,
  region TEXT NOT NULL,
  country TEXT NOT NULL,
  established INTEGER,
  story TEXT,
  description TEXT,
  acreage DECIMAL,
  awards_count INTEGER DEFAULT 0,
  website_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wines Table (酒款)
CREATE TABLE IF NOT EXISTS wines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  winery_id UUID REFERENCES wineries(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  vintage INTEGER,
  varietal TEXT NOT NULL,
  price DECIMAL NOT NULL,
  original_price DECIMAL,
  image_url TEXT NOT NULL,
  gallery_urls TEXT[],
  alcohol_content DECIMAL,
  volume INTEGER DEFAULT 750,
  tasting_notes TEXT,
  food_pairing TEXT[],
  serving_temperature TEXT,
  aging_potential TEXT,
  wine_type TEXT NOT NULL,
  wine_style TEXT,
  region TEXT,
  appellation TEXT,
  stock INTEGER DEFAULT 0,
  is_limited BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  awards TEXT[],
  ratings JSONB,
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts Table (部落格)
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  category TEXT,
  tags TEXT[],
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inquiries Table (詢價記錄)
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  wine_ids UUID[],
  message TEXT,
  inquiry_type TEXT DEFAULT 'product',
  status TEXT DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Chat History Table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL,
  recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_wines_winery_id ON wines(winery_id);
CREATE INDEX IF NOT EXISTS idx_wines_slug ON wines(slug);
CREATE INDEX IF NOT EXISTS idx_wines_price ON wines(price);
CREATE INDEX IF NOT EXISTS idx_wines_wine_type ON wines(wine_type);
CREATE INDEX IF NOT EXISTS idx_wines_is_featured ON wines(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Create updated_at triggers
-- 設置 search_path 以防止安全問題
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_wineries_updated_at BEFORE UPDATE ON wineries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wines_updated_at BEFORE UPDATE ON wines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE wineries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Wineries are viewable by everyone"
  ON wineries FOR SELECT
  USING (true);

CREATE POLICY "Wines are viewable by everyone"
  ON wines FOR SELECT
  USING (true);

CREATE POLICY "Blog posts are viewable by everyone"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Anyone can create inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

-- AI Chat History RLS Policies
CREATE POLICY "ai_chat_history is viewable by everyone"
  ON ai_chat_history FOR SELECT
  USING (true);

CREATE POLICY "ai_chat_history can be inserted by authenticated users"
  ON ai_chat_history FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ai_chat_history can be updated by owner"
  ON ai_chat_history FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "ai_chat_history can be deleted by owner"
  ON ai_chat_history FOR DELETE
  USING (true);

