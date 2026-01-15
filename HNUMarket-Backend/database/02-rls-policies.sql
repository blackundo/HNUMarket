-- ============================================================
-- HNUMarket Row Level Security (RLS) Policies
-- Version: 2.0
-- Run: After 01-schema.sql
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: is_admin
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin
(user_id UUID)
RETURNS BOOLEAN AS $$
SELECT EXISTS
(
    SELECT 1
FROM public.profiles
WHERE id = user_id AND role = 'admin'
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- 1. PROFILES RLS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY
IF EXISTS "Users read own" ON public.profiles;
DROP POLICY
IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY
IF EXISTS "Admin read all" ON public.profiles;
DROP POLICY
IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY
IF EXISTS "Users update own" ON public.profiles;
DROP POLICY
IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY
IF EXISTS "Admin update all" ON public.profiles;
DROP POLICY
IF EXISTS "Enable insert for service role" ON public.profiles;
DROP POLICY
IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY
IF EXISTS "Allow trigger insert" ON public.profiles;

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR
SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR
SELECT USING (public.is_admin(auth.uid()));

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR
UPDATE USING (auth.uid()
= id);

-- Admin can update all profiles
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR
UPDATE USING (public.is_admin(auth.uid())
);

-- Allow trigger to insert profiles (IMPORTANT!)
CREATE POLICY "profiles_insert_trigger" ON public.profiles
  FOR
INSERT WITH CHECK
  (true)
;

-- ============================================================
-- 2. CATEGORIES RLS
-- ============================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read" ON public.categories;
DROP POLICY
IF EXISTS "Admin write" ON public.categories;
DROP POLICY
IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY
IF EXISTS "categories_all_admin" ON public.categories;

-- Public can read all categories
CREATE POLICY "categories_select_public" ON public.categories
  FOR
SELECT USING (true);

-- Admin has full access
CREATE POLICY "categories_all_admin" ON public.categories
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 3. PRODUCTS RLS
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read active products" ON public.products;
DROP POLICY
IF EXISTS "Admin full access" ON public.products;
DROP POLICY
IF EXISTS "products_select_active" ON public.products;
DROP POLICY
IF EXISTS "products_all_admin" ON public.products;

-- Public can read active products
CREATE POLICY "products_select_active" ON public.products
  FOR
SELECT USING (is_active = true);

-- Admin has full access (including inactive)
CREATE POLICY "products_all_admin" ON public.products
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 4. PRODUCT IMAGES RLS
-- ============================================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read" ON public.product_images;
DROP POLICY
IF EXISTS "Admin write" ON public.product_images;
DROP POLICY
IF EXISTS "product_images_select_public" ON public.product_images;
DROP POLICY
IF EXISTS "product_images_all_admin" ON public.product_images;

-- Public can read all images
CREATE POLICY "product_images_select_public" ON public.product_images
  FOR
SELECT USING (true);

-- Admin has full access
CREATE POLICY "product_images_all_admin" ON public.product_images
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 5. PRODUCT VARIANTS RLS
-- ============================================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read" ON public.product_variants;
DROP POLICY
IF EXISTS "Admin write" ON public.product_variants;
DROP POLICY
IF EXISTS "product_variants_select_public" ON public.product_variants;
DROP POLICY
IF EXISTS "product_variants_all_admin" ON public.product_variants;

-- Public can read all variants
CREATE POLICY "product_variants_select_public" ON public.product_variants
  FOR
SELECT USING (true);

-- Admin has full access
CREATE POLICY "product_variants_all_admin" ON public.product_variants
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 6. POSTS RLS
-- ============================================================
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read published posts" ON public.posts;
DROP POLICY
IF EXISTS "Admin full access" ON public.posts;
DROP POLICY
IF EXISTS "posts_select_published" ON public.posts;
DROP POLICY
IF EXISTS "posts_all_admin" ON public.posts;

-- Public can read published posts
CREATE POLICY "posts_select_published" ON public.posts
  FOR
SELECT USING (status = 'published');

-- Admin has full access
CREATE POLICY "posts_all_admin" ON public.posts
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 7. PAGES RLS
-- ============================================================
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "pages_select_published" ON public.pages;
DROP POLICY
IF EXISTS "pages_all_admin" ON public.pages;

-- Public can read published pages
CREATE POLICY "pages_select_published" ON public.pages
  FOR
SELECT USING (status = 'published');

-- Admin has full access
CREATE POLICY "pages_all_admin" ON public.pages
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 8. ORDERS RLS
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY
IF EXISTS "Admin full access" ON public.orders;
DROP POLICY
IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY
IF EXISTS "orders_all_admin" ON public.orders;
DROP POLICY
IF EXISTS "orders_insert_own" ON public.orders;

-- Users can read their own orders
CREATE POLICY "orders_select_own" ON public.orders
  FOR
SELECT USING (user_id = auth.uid());

-- Users can create orders
CREATE POLICY "orders_insert_own" ON public.orders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admin has full access
CREATE POLICY "orders_all_admin" ON public.orders
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 9. ORDER ITEMS RLS
-- ============================================================
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Users read own order items" ON public.order_items;
DROP POLICY
IF EXISTS "Admin full access" ON public.order_items;
DROP POLICY
IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY
IF EXISTS "order_items_all_admin" ON public.order_items;

-- Users can read their own order items
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR
SELECT USING (
    EXISTS (
      SELECT 1
  FROM public.orders
  WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
    )
  );

-- Admin has full access
CREATE POLICY "order_items_all_admin" ON public.order_items
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 10. SHIPPING ZONES RLS
-- ============================================================
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read zones" ON public.shipping_zones;
DROP POLICY
IF EXISTS "Admin write zones" ON public.shipping_zones;
DROP POLICY
IF EXISTS "shipping_zones_select_public" ON public.shipping_zones;
DROP POLICY
IF EXISTS "shipping_zones_all_admin" ON public.shipping_zones;

-- Public can read zones
CREATE POLICY "shipping_zones_select_public" ON public.shipping_zones
  FOR
SELECT USING (true);

-- Admin has full access
CREATE POLICY "shipping_zones_all_admin" ON public.shipping_zones
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 11. SHIPPING RATES RLS
-- ============================================================
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read rates" ON public.shipping_rates;
DROP POLICY
IF EXISTS "Admin write rates" ON public.shipping_rates;
DROP POLICY
IF EXISTS "shipping_rates_select_public" ON public.shipping_rates;
DROP POLICY
IF EXISTS "shipping_rates_all_admin" ON public.shipping_rates;

-- Public can read rates
CREATE POLICY "shipping_rates_select_public" ON public.shipping_rates
  FOR
SELECT USING (true);

-- Admin has full access
CREATE POLICY "shipping_rates_all_admin" ON public.shipping_rates
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 12. SETTINGS RLS
-- ============================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read settings" ON public.settings;
DROP POLICY
IF EXISTS "Admin write" ON public.settings;
DROP POLICY
IF EXISTS "settings_select_public" ON public.settings;
DROP POLICY
IF EXISTS "settings_all_admin" ON public.settings;

-- Public can read settings
CREATE POLICY "settings_select_public" ON public.settings
  FOR
SELECT USING (true);

-- Admin has full access
CREATE POLICY "settings_all_admin" ON public.settings
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- 13. HERO SLIDES RLS
-- ============================================================
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY
IF EXISTS "Public read active hero slides" ON public.hero_slides;
DROP POLICY
IF EXISTS "Admin full access" ON public.hero_slides;
DROP POLICY
IF EXISTS "hero_slides_select_active" ON public.hero_slides;
DROP POLICY
IF EXISTS "hero_slides_all_admin" ON public.hero_slides;

-- Public can read active hero slides
CREATE POLICY "hero_slides_select_active" ON public.hero_slides
  FOR
SELECT USING (is_active = true);

-- Admin has full access
CREATE POLICY "hero_slides_all_admin" ON public.hero_slides
  FOR ALL USING
(public.is_admin
(auth.uid
()));

-- ============================================================
-- RLS POLICIES COMPLETE
-- ============================================================
SELECT 'RLS policies created successfully!' as status;
