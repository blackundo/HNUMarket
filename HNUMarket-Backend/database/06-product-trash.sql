-- Migration: Product Trash/Recycle Bin System
-- Date: 2025-12-30
-- Description: Implements trash bin for products with auto-delete after 10 days

-- ============================================================================
-- 1. Create product_trash table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_trash (
  -- Primary key (preserve original product ID)
  id UUID PRIMARY KEY,

  -- Original product data (all columns from products table)
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL,
  original_price BIGINT,
  meta_title TEXT,
  meta_description TEXT,
  category_id UUID,  -- No FK reference, category may be deleted
  stock INT DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  sold INT DEFAULT 0,
  location TEXT,
  badges TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  product_created_at TIMESTAMPTZ,
  product_updated_at TIMESTAMPTZ,

  -- Denormalized related data (JSONB for easy restore)
  images JSONB DEFAULT '[]',
  variants JSONB DEFAULT '[]',

  -- Trash metadata
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- expires_at is calculated in application code (NOW() + 10 days)
  -- Cannot use GENERATED ALWAYS AS because NOW() is not immutable
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- 2. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_trash_expires ON public.product_trash(expires_at);
CREATE INDEX IF NOT EXISTS idx_product_trash_deleted_at ON public.product_trash(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_trash_slug ON public.product_trash(slug);
CREATE INDEX IF NOT EXISTS idx_product_trash_name ON public.product_trash(name);

-- ============================================================================
-- 3. Enable Row Level Security
-- ============================================================================

ALTER TABLE public.product_trash ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "product_trash_all_admin" ON public.product_trash;

-- Admin full access
CREATE POLICY "product_trash_all_admin" ON public.product_trash
  FOR ALL
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- 4. Enable pg_cron extension (for auto-delete)
-- ============================================================================

-- Note: pg_cron may need to be enabled by Supabase admin
-- If you get a permission error, enable it via Supabase dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- ============================================================================
-- 5. Create auto-delete cleanup function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_product_trash()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete products past their expiration
  DELETE FROM public.product_trash
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the cleanup
  RAISE LOG 'product_trash cleanup: % products permanently deleted at %',
    deleted_count, NOW() AT TIME ZONE 'Asia/Saigon';

  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 6. Schedule cron job for daily cleanup
-- ============================================================================

-- Unschedule existing job if it exists
SELECT cron.unschedule('cleanup-expired-product-trash') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-product-trash'
);

-- Schedule daily cleanup at 3:00 AM Asia/Saigon (8:00 PM UTC previous day)
-- Note: Supabase cron uses UTC timezone
SELECT cron.schedule(
  'cleanup-expired-product-trash',        -- job name
  '0 20 * * *',                           -- 8:00 PM UTC = 3:00 AM UTC+7
  $$SELECT public.cleanup_expired_product_trash()$$
);

-- ============================================================================
-- 7. Verify setup
-- ============================================================================

-- Check if cron job is scheduled
SELECT jobid, jobname, schedule, command, nodename, nodeport, database, username, active
FROM cron.job
WHERE jobname = 'cleanup-expired-product-trash';

-- ============================================================================
-- 8. Helper queries (for admin use)
-- ============================================================================

-- Manual cleanup (for testing or admin use)
-- SELECT public.cleanup_expired_product_trash();

-- Check expired items before cleanup
-- SELECT id, name, deleted_at, expires_at, expires_at - NOW() as time_remaining
-- FROM public.product_trash
-- WHERE expires_at < NOW();

-- Count items in trash
-- SELECT COUNT(*) as total_trash_items FROM public.product_trash;

-- ============================================================================
-- 9. OPTIONAL: Migrate existing inactive products to trash
-- ============================================================================

-- IMPORTANT: This is commented out by default. Only run if you want to
-- migrate existing is_active = false products to trash.

/*
-- Review inactive products first
SELECT id, name, is_active, updated_at
FROM public.products
WHERE is_active = false;

-- Migrate inactive products to trash
INSERT INTO public.product_trash (
  id, slug, name, description, price, original_price, category_id,
  stock, rating, review_count, sold, location, badges, specifications,
  is_active, is_featured, product_created_at, product_updated_at,
  images, variants
)
SELECT
  p.id, p.slug, p.name, p.description, p.price, p.original_price, p.category_id,
  p.stock, p.rating, p.review_count, p.sold, p.location, p.badges, p.specifications,
  p.is_active, p.is_featured, p.created_at, p.updated_at,
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', i.id,
      'url', i.url,
      'alt_text', i.alt_text,
      'display_order', i.display_order
    ))
    FROM product_images i
    WHERE i.product_id = p.id
  ), '[]'),
  COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'id', v.id,
      'name', v.name,
      'display_name', v.display_name,
      'type', v.type,
      'value', v.value,
      'unit', v.unit,
      'conversion_rate', v.conversion_rate,
      'stock', v.stock,
      'price', v.price,
      'price_adjustment', v.price_adjustment
    ))
    FROM product_variants v
    WHERE v.product_id = p.id
  ), '[]')
FROM public.products p
WHERE p.is_active = false;

-- Delete migrated products from main table
-- DELETE FROM public.products WHERE is_active = false;
*/

-- ============================================================================
-- Migration complete
-- ============================================================================
