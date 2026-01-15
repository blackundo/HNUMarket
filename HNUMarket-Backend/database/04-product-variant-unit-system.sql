-- ============================================================
-- ProductVariant Unit System Migration
-- Created: 2025-12-24
-- Description: Add unit-based variant system for grocery products
-- Run: After 01-schema.sql, 02-rls-policies.sql, 03-seed-data.sql
-- ============================================================

-- Step 1: Add new columns for unit system
ALTER TABLE public.product_variants
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'goi',
ADD COLUMN IF NOT EXISTS conversion_rate INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Step 2: Add CHECK constraint for unit values (14 Vietnamese units)
ALTER TABLE public.product_variants
DROP CONSTRAINT IF EXISTS product_variants_unit_check;

ALTER TABLE public.product_variants
ADD CONSTRAINT product_variants_unit_check
CHECK (unit IN (
  'goi',   -- Gói - package/pack
  'loc',   -- Lốc - bundle (4-6 items)
  'thung', -- Thùng - carton/case
  'chai',  -- Chai - bottle
  'hop',   -- Hộp - box
  'lon',   -- Lon - can
  'kg',    -- Kilogram
  'g',     -- Gram
  'l',     -- Liter
  'ml',    -- Milliliter
  'cai',   -- Cái - piece/item
  'bo',    -- Bộ - set
  'tui',   -- Túi - bag
  'vi'     -- Vỉ - blister pack
));

-- Step 3: Add CHECK constraint for conversion_rate (must be positive)
ALTER TABLE public.product_variants
DROP CONSTRAINT IF EXISTS product_variants_conversion_rate_check;

ALTER TABLE public.product_variants
ADD CONSTRAINT product_variants_conversion_rate_check
CHECK (conversion_rate > 0);

-- Step 4: Add index for unit queries (performance optimization)
CREATE INDEX IF NOT EXISTS idx_product_variants_unit
ON public.product_variants(unit);

-- Step 5: Migrate existing data
-- Set price to 0 if NULL (to prepare for making it NOT NULL later)
UPDATE public.product_variants
SET price = COALESCE(price, 0)
WHERE price IS NULL;

-- Set display_name from name if NULL
UPDATE public.product_variants
SET display_name = COALESCE(display_name, name)
WHERE display_name IS NULL;

-- Step 6: Add column comments for documentation
COMMENT ON COLUMN public.product_variants.unit IS 'Vietnamese unit type: goi, loc, thung, chai, hop, lon, kg, g, l, ml, cai, bo, tui, vi';
COMMENT ON COLUMN public.product_variants.conversion_rate IS 'Conversion ratio to base unit (goi=1, loc 6=6, thung 24=24)';
COMMENT ON COLUMN public.product_variants.display_name IS 'Vietnamese display name with quantity (e.g., "1 Gói", "Lốc 6 gói")';

-- Step 7: Optional - Make price NOT NULL after migration
-- Uncomment after verifying all data is migrated correctly
-- ALTER TABLE public.product_variants ALTER COLUMN price SET NOT NULL;

-- ============================================================
-- Migration Complete
-- Notes:
-- - Existing variants will have default values: unit='goi', conversion_rate=1
-- - price_adjustment field is DEPRECATED but kept for backward compatibility
-- - Run seed data updates to populate variants with new unit system
-- ============================================================
