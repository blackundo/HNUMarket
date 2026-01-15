-- ============================================================
-- HNUMarket Shipping System Redesign
-- Version: 2.0
-- Purpose: Replace complex zone/rate system with simple fixed-fee locations
-- Run: After 04-product-variant-unit-system.sql
-- ============================================================

-- ============================================================
-- 1. DROP OLD SHIPPING TABLES
-- ============================================================
DROP TABLE IF EXISTS public.shipping_rates CASCADE;
DROP TABLE IF EXISTS public.shipping_zones CASCADE;

-- ============================================================
-- 2. CREATE SHIPPING_LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.shipping_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_shipping_locations_active
  ON public.shipping_locations(is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_shipping_locations_display_order
  ON public.shipping_locations(display_order);

-- ============================================================
-- 4. APPLY UPDATED_AT TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS set_shipping_locations_updated_at ON public.shipping_locations;
CREATE TRIGGER set_shipping_locations_updated_at
  BEFORE UPDATE ON public.shipping_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 5. SEED DATA (Korean Locations with Fixed Fees)
-- ============================================================
INSERT INTO public.shipping_locations (name, fee, display_order) VALUES
  ('홍도동', 2500, 1),
  ('용전동', 2500, 2),
  ('오정동', 2500, 3),
  ('종리동', 2500, 4),
  ('대화동', 3500, 5),
  ('법동', 3500, 6),
  ('송촌동', 3500, 7),
  ('가양동', 3500, 8),
  ('성남동', 3500, 9),
  ('종촌동', 3500, 10),
  ('삼성동', 3500, 11),
  ('탄방동', 5600, 12),
  ('용문동', 5600, 13),
  ('용두동', 5600, 14),
  ('목동', 5600, 15),
  ('은행동', 5600, 16),
  ('자양동', 5600, 17),
  ('대동', 5600, 18),
  ('둔산동', 5600, 19),
  ('기타', 4000, 20)
ON CONFLICT DO NOTHING;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
SELECT 'Shipping locations migration completed successfully!' as status;
