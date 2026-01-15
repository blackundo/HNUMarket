-- ============================================================
-- Migrate Existing Product Variants Data (Normalized Schema)
-- Created: 2026-01-01
-- Description: Migrate data from product_variants_old to new normalized schema
-- Run: After 07-multi-attribute-variants-normalized.sql
-- ============================================================

-- ============================================================
-- STEP 1: ANALYZE EXISTING DATA
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=== ANALYZING EXISTING VARIANTS ===';
END $$;

-- Count total variants to migrate
SELECT
  COUNT(*) as total_variants,
  COUNT(DISTINCT product_id) as total_products_with_variants
FROM product_variants_old;

-- Show sample of variants to migrate
SELECT
  p.name as product_name,
  p.slug as product_slug,
  pv.name as variant_name,
  pv.display_name as variant_display_name,
  pv.value as variant_value,
  pv.stock,
  pv.price
FROM product_variants_old pv
JOIN products p ON p.id = pv.product_id
LIMIT 5;

-- ============================================================
-- STEP 2: MIGRATE DATA TO NEW SCHEMA
-- ============================================================
DO $$
DECLARE
    r_old RECORD;
    v_option_id UUID;
    v_value_id UUID;
    v_variant_id UUID;
BEGIN
    RAISE NOTICE '=== STARTING DATA MIGRATION ===';

    -- Loop through each row in the old product_variants_old table
    FOR r_old IN SELECT * FROM public.product_variants_old LOOP

        -- 1. Find or create Option (based on old 'type' column, e.g., 'unit', 'size', 'color')
        -- ---------------------------------------------------------
        -- MAPPING CHANGE: old.type -> old.value
        -- ---------------------------------------------------------
        -- Check if this product already has an option with this type
        SELECT id INTO v_option_id
        FROM public.product_options
        WHERE product_id = r_old.product_id AND name = r_old.value
        LIMIT 1;

        IF v_option_id IS NULL THEN
            -- Create new option
            INSERT INTO public.product_options (product_id, name, position)
            VALUES (r_old.product_id, r_old.value, 0)
            RETURNING id INTO v_option_id;

            RAISE NOTICE 'Created option: % for product: %', r_old.value, r_old.product_id;
        END IF;

        -- ---------------------------------------------------------
        -- 2. Create Option Value (based on old 'value' column, e.g., 'goi', 'loc', 'Red')
        -- MAPPING CHANGE: old.value -> old.display_name
        -- ---------------------------------------------------------
        
        INSERT INTO public.product_option_values (option_id, value)
        VALUES (v_option_id, r_old.display_name)
        RETURNING id INTO v_value_id;

        -- 3. Create New Variant (SKU)
        -- Transfer price, original_price and stock from old table
        INSERT INTO public.product_variants (
            product_id,
            sku,
            price,
            original_price,
            stock,
            is_active,
            created_at
        )
        VALUES (
            r_old.product_id,
            NULL, -- SKU will be NULL for now, can be generated later if needed
            r_old.price,
            NULL, -- original_price not available in old schema, set to NULL
            r_old.stock,
            true,
            r_old.created_at
        )
        RETURNING id INTO v_variant_id;

        -- 4. Create Junction Record (link variant to option value)
        INSERT INTO public.product_variant_option_values (variant_id, option_value_id)
        VALUES (v_variant_id, v_value_id);

    END LOOP;

    RAISE NOTICE '=== MIGRATION COMPLETED ===';
END $$;

-- ============================================================
-- STEP 3: VERIFY MIGRATION RESULTS
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=== VERIFYING MIGRATION ===';
END $$;

-- Compare record counts
SELECT
  'product_variants_old' as table_name,
  COUNT(*) as record_count
FROM product_variants_old
UNION ALL
SELECT
  'product_variants (new)' as table_name,
  COUNT(*) as record_count
FROM product_variants
UNION ALL
SELECT
  'product_options' as table_name,
  COUNT(*) as record_count
FROM product_options
UNION ALL
SELECT
  'product_option_values' as table_name,
  COUNT(*) as record_count
FROM product_option_values
UNION ALL
SELECT
  'product_variant_option_values (junction)' as table_name,
  COUNT(*) as record_count
FROM product_variant_option_values;

-- Show sample of migrated data
SELECT
  p.name as product_name,
  po.name as option_name,
  pov.value as option_value,
  pv.price,
  pv.stock
FROM product_variants pv
JOIN products p ON p.id = pv.product_id
JOIN product_variant_option_values pvov ON pvov.variant_id = pv.id
JOIN product_option_values pov ON pov.id = pvov.option_value_id
JOIN product_options po ON po.id = pov.option_id
LIMIT 5;

-- ============================================================
-- STEP 4: VALIDATION CHECKS
-- ============================================================
-- Check for orphaned records
SELECT
  'Orphaned product_option_values' as check_name,
  COUNT(*) as count
FROM product_option_values pov
WHERE NOT EXISTS (
  SELECT 1 FROM product_options po WHERE po.id = pov.option_id
);

SELECT
  'Orphaned product_variant_option_values' as check_name,
  COUNT(*) as count
FROM product_variant_option_values pvov
WHERE NOT EXISTS (
  SELECT 1 FROM product_variants pv WHERE pv.id = pvov.variant_id
);

-- ============================================================
-- MIGRATION VERIFICATION COMPLETE
-- ============================================================
SELECT '✅ Data migration completed successfully!' as status;
SELECT '⚠️  Review the verification results above before proceeding' as warning;
SELECT 'Next: Update backend code to use new schema' as next_step;
SELECT 'After backend is updated and tested, you can optionally drop product_variants_old' as cleanup;
