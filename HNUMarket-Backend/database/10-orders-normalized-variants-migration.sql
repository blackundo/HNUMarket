-- ============================================================
-- Orders Migration for Normalized Variant System
-- Created: 2026-01-02
-- Description: Ensure orders work with new normalized product variants
-- Run: After 07-multi-attribute-variants-normalized.sql and 08-migrate-variants-data-normalized.sql
-- ============================================================

-- ============================================================
-- STEP 1: FIX FOREIGN KEY CONSTRAINTS FOR NEW VARIANT SCHEMA
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=== FIXING ORDER_ITEMS FOREIGN KEY CONSTRAINTS ===';
END $$;

-- Drop old foreign key constraint (if exists and pointing to old table)
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find existing foreign key constraint for variant_id
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'order_items'
      AND kcu.column_name = 'variant_id'
    LIMIT 1;

    -- Drop if exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped old constraint: %', constraint_name;
    END IF;
END $$;

-- Recreate foreign key pointing to NEW product_variants table
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey,
  ADD CONSTRAINT order_items_variant_id_fkey
    FOREIGN KEY (variant_id)
    REFERENCES public.product_variants(id)
    ON DELETE SET NULL;

-- Verify the new constraint
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'order_items'
  AND kcu.column_name = 'variant_id';

-- ============================================================
-- STEP 2: ADD ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================

-- Index for querying orders by status and date
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders(status, created_at DESC);

-- Index for querying user orders
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);

-- Index for querying order items by product
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- Index for querying order items by variant
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

-- ============================================================
-- STEP 3: ADD FUNCTION TO GET VARIANT DISPLAY NAME
-- ============================================================
-- This function retrieves the display name of a variant with all its option values
-- IMPORTANT: Orders by option position for consistent display (e.g., "Color / Size" not "Size / Color")
CREATE OR REPLACE FUNCTION get_variant_display_name(p_variant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_display_name TEXT := '';
    v_option_value TEXT;
BEGIN
    -- Concatenate all option values for this variant
    -- ORDER BY option position (not option_value id) for consistent ordering
    FOR v_option_value IN
        SELECT pov.value
        FROM product_variant_option_values pvov
        JOIN product_option_values pov ON pov.id = pvov.option_value_id
        JOIN product_options po ON po.id = pov.option_id
        WHERE pvov.variant_id = p_variant_id
        ORDER BY po.position, pov.value  -- Order by option position first, then value
    LOOP
        IF v_display_name = '' THEN
            v_display_name := v_option_value;
        ELSE
            v_display_name := v_display_name || ' / ' || v_option_value;
        END IF;
    END LOOP;

    RETURN v_display_name;
END;
$$;

-- ============================================================
-- STEP 4: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================
COMMENT ON TABLE public.orders IS 'Customer orders with shipping and payment info';
COMMENT ON TABLE public.order_items IS 'Line items for each order with product/variant details';

-- IMPORTANT: New variant schema does NOT have old fields (name, type, value, display_name, unit)
-- Variant display name is built from product_option_values via junction table
COMMENT ON COLUMN public.order_items.variant_id IS 'References new normalized product_variants(id). Variant details come from product_variant_option_values junction table.';
COMMENT ON COLUMN public.order_items.product_name IS 'Snapshot of product name at time of order (prevents changes when product name updated)';
COMMENT ON COLUMN public.order_items.variant_name IS 'Snapshot of variant display name at time of order (e.g., "Red / XL / Cotton"). Built from option values when order created.';

-- ============================================================
-- STEP 5: ADD STOCK MANAGEMENT FUNCTIONS
-- ============================================================

-- Function to decrement variant stock
CREATE OR REPLACE FUNCTION decrement_variant_stock(p_variant_id UUID, p_quantity INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE product_variants
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_variant_id;
END;
$$;

-- Function to increment variant stock (for cancellations/returns)
CREATE OR REPLACE FUNCTION increment_variant_stock(p_variant_id UUID, p_quantity INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE product_variants
    SET stock = stock + p_quantity
    WHERE id = p_variant_id;
END;
$$;

-- Function to decrement product stock (for products without variants)
CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_product_id;
END;
$$;

-- Function to increment product stock (for cancellations/returns)
CREATE OR REPLACE FUNCTION increment_product_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products
    SET stock = stock + p_quantity
    WHERE id = p_product_id;
END;
$$;

-- ============================================================
-- STEP 6: CREATE VIEW FOR ORDER DETAILS WITH VARIANT INFO
-- ============================================================
CREATE OR REPLACE VIEW order_details_with_variants AS
SELECT
    -- Order info
    o.id as order_id,
    o.order_number,
    o.user_id,
    o.status as order_status,
    o.subtotal,
    o.shipping_fee,
    o.discount,
    o.total,
    o.payment_method,
    o.payment_status,
    o.shipping_address,
    o.billing_address,
    o.notes,
    o.created_at as order_date,
    o.updated_at as order_updated_at,

    -- Order item info
    oi.id as item_id,
    oi.product_id,
    oi.variant_id,
    oi.product_name as item_product_name,
    oi.variant_name as item_variant_name,  -- Snapshot at order time
    oi.quantity,
    oi.unit_price,
    oi.total_price,

    -- Current product info (may differ from snapshot)
    p.name as current_product_name,
    p.slug as product_slug,
    p.price as current_product_price,
    p.stock as current_product_stock,
    p.is_active as product_is_active,

    -- Current variant info (may differ from snapshot)
    pv.sku as variant_sku,
    pv.price as current_variant_price,
    pv.stock as current_variant_stock,
    pv.is_active as variant_is_active,

    -- Current variant display name (built from option values using fixed function)
    CASE
        WHEN oi.variant_id IS NOT NULL
        THEN get_variant_display_name(oi.variant_id)
        ELSE NULL
    END as current_variant_display_name

FROM orders o
JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
LEFT JOIN product_variants pv ON pv.id = oi.variant_id;

COMMENT ON VIEW order_details_with_variants IS 'Complete order view with both snapshot (order time) and current product/variant data. Use item_variant_name for what was ordered, current_variant_display_name for current status.';

-- ============================================================
-- STEP 7: VERIFY MIGRATION
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
END $$;

-- Count existing orders and items
SELECT
  'orders' as table_name,
  COUNT(*) as record_count
FROM orders
UNION ALL
SELECT
  'order_items' as table_name,
  COUNT(*) as record_count
FROM order_items;

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
SELECT '✅ Orders migration for normalized variants completed successfully!' as status;
SELECT 'Orders and order_items now compatible with new product_variants schema' as result;
SELECT 'Use get_variant_display_name(variant_id) to get full variant name' as helper_function;
