-- ============================================================
-- HNUMarket Database Schema
-- Version: 2.0
-- Run: First (before other scripts)
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================
-- 2. AUTO-CREATE PROFILE TRIGGER (QUAN TRỌNG!)
-- ============================================================
-- Function to auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error for user %: % %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 4. CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(is_active);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_categories_updated_at ON public.categories;
CREATE TRIGGER set_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  original_price BIGINT,
  meta_title TEXT,
  meta_description TEXT,
  sku TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  stock INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  sold INT DEFAULT 0,
  location TEXT,
  badges TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 6. PRODUCT IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);

-- ============================================================
-- 7. PRODUCT VARIANTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  stock INT DEFAULT 0,
  price BIGINT,
  price_adjustment BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants(product_id);

-- ============================================================
-- 8. POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image_url TEXT,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 9. PAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_pages_updated_at ON public.pages;
CREATE TRIGGER set_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 10. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal BIGINT NOT NULL,
  shipping_fee BIGINT DEFAULT 0,
  discount BIGINT DEFAULT 0,
  total BIGINT NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 11. ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INT NOT NULL,
  unit_price BIGINT NOT NULL,
  total_price BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ============================================================
-- 12. SHIPPING ZONES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  regions TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_shipping_zones_updated_at ON public.shipping_zones;
CREATE TRIGGER set_shipping_zones_updated_at
  BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 13. SHIPPING RATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.shipping_zones(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  name TEXT NOT NULL,
  min_weight INT DEFAULT 0,
  max_weight INT,
  base_rate BIGINT NOT NULL,
  per_kg_rate BIGINT DEFAULT 0,
  estimated_days TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone ON public.shipping_rates(zone_id);

-- ============================================================
-- 14. SETTINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.settings (key, value, category) VALUES
  ('site_name', '"HNUMarket"', 'general'),
  ('site_description', '"Sản phẩm Việt Nam tại Hàn Quốc"', 'general'),
  ('currency', '"KRW"', 'general'),
  ('contact_email', '"contact@hnumarket.com"', 'contact'),
  ('contact_phone', '"+82 XXX XXXX XXXX"', 'contact')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 15. HERO SLIDES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  gradient TEXT,
  link TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON public.hero_slides(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON public.hero_slides(display_order);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER set_hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- SCHEMA COMPLETE
-- ============================================================
SELECT 'Schema created successfully!' as status;
