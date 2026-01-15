-- ============================================================
-- Multi-Attribute Product Variants Migration (Normalized Schema)
-- Created: 2026-01-01
-- Description: Migrate from single-attribute to multi-attribute variant system
-- Run: After 01-schema.sql, 02-rls-policies.sql, 03-seed-data.sql
-- ============================================================

-- ============================================================
-- STEP 1: BACKUP CURRENT TABLE
-- ============================================================
-- Rename current product_variants to product_variants_old for safety
ALTER TABLE IF EXISTS public.product_variants RENAME TO product_variants_old;

-- Rename index
ALTER INDEX IF EXISTS idx_product_variants_product RENAME TO idx_product_variants_old_product;

-- ============================================================
-- STEP 2: CREATE NEW NORMALIZED SCHEMA
-- ============================================================

-- 2.1 Product Options Table (Attribute Names)
-- Defines attribute names for a product (e.g., "Size", "Color", "Material")
CREATE TABLE IF NOT EXISTS public.product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Size", "Color", "Material"
  position INT DEFAULT 0, -- Display order
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_options_product ON public.product_options(product_id);
CREATE INDEX idx_product_options_position ON public.product_options(product_id, position);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_product_options_updated_at ON public.product_options;
CREATE TRIGGER set_product_options_updated_at
  BEFORE UPDATE ON public.product_options
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2.2 Product Option Values Table (Attribute Values)
-- Defines possible values for each attribute (e.g., "S", "M", "L" for Size)
CREATE TABLE IF NOT EXISTS public.product_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES public.product_options(id) ON DELETE CASCADE,
  value TEXT NOT NULL, -- e.g., "XL", "Green", "Cotton"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_option_values_option ON public.product_option_values(option_id);

-- 2.3 Product Variants Table (Refactored)
-- Represents a unique SKU with specific attribute combinations
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE, -- Warehouse code (e.g., "SHIRT-BLUE-XL")
  price BIGINT, -- Variant-specific price (NULL = use product default price)
  original_price BIGINT,
  stock INT DEFAULT 0, -- Inventory for this variant
  image_url TEXT, -- Variant-specific image (optional)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_product_variants_active ON public.product_variants(is_active) WHERE is_active = true;

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS set_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 2.4 Product Variant Option Values Table (Junction)
-- Links variants to their specific attribute values
CREATE TABLE IF NOT EXISTS public.product_variant_option_values (
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  option_value_id UUID NOT NULL REFERENCES public.product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);

CREATE INDEX idx_variant_option_values_variant ON public.product_variant_option_values(variant_id);
CREATE INDEX idx_variant_option_values_option ON public.product_variant_option_values(option_value_id);

-- ============================================================
-- STEP 3: CREATE TRIGGER TO AUTO-UPDATE PRODUCT TOTAL STOCK
-- ============================================================
CREATE OR REPLACE FUNCTION update_product_total_stock() RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT and UPDATE, use NEW.product_id
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.products
        SET stock = (
            SELECT COALESCE(SUM(stock), 0)
            FROM public.product_variants
            WHERE product_id = OLD.product_id
        )
        WHERE id = OLD.product_id;
        RETURN OLD;
    ELSE
        UPDATE public.products
        SET stock = (
            SELECT COALESCE(SUM(stock), 0)
            FROM public.product_variants
            WHERE product_id = NEW.product_id
        )
        WHERE id = NEW.product_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_stock ON public.product_variants;
CREATE TRIGGER trg_update_stock
AFTER INSERT OR UPDATE OF stock OR DELETE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION update_product_total_stock();

-- ============================================================
-- STEP 4: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE public.product_options IS 'Attribute names for products (Size, Color, Material, etc.)';
COMMENT ON TABLE public.product_option_values IS 'Possible values for each product attribute';
COMMENT ON TABLE public.product_variants IS 'Product SKUs with specific attribute combinations';
COMMENT ON TABLE public.product_variant_option_values IS 'Junction table linking variants to their attribute values';
COMMENT ON COLUMN public.product_variants.sku IS 'Optional SKU/barcode for warehouse management';
COMMENT ON COLUMN public.product_variants.price IS 'Variant price (NULL uses product base price)';
COMMENT ON COLUMN public.product_variants.original_price IS 'Original price for discount display (optional)';

-- ============================================================
-- SCHEMA CREATED SUCCESSFULLY
-- Next: Run data migration script (08-migrate-variants-data-normalized.sql)
-- ============================================================
SELECT 'Multi-attribute normalized schema created successfully!' as status;
SELECT 'Old product_variants table renamed to product_variants_old' as backup_status;
SELECT 'Next: Run 08-migrate-variants-data-normalized.sql to migrate data' as next_step;
