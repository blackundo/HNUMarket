-- ============================================================
-- Multi-Attribute Variants RLS Policies
-- Created: 2026-01-02
-- Description: Row Level Security policies for normalized variant system
-- Run: After 07-multi-attribute-variants-normalized.sql
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variant_option_values ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: PRODUCT OPTIONS POLICIES
-- ============================================================

-- Anonymous/Public: SELECT only active product options
DROP POLICY IF EXISTS "product_options_select_policy" ON public.product_options;
CREATE POLICY "product_options_select_policy"
  ON public.product_options
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_options.product_id
      AND p.is_active = true
    )
  );

-- Admin: Full access to product options
DROP POLICY IF EXISTS "product_options_admin_all" ON public.product_options;
CREATE POLICY "product_options_admin_all"
  ON public.product_options
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================
-- STEP 3: PRODUCT OPTION VALUES POLICIES
-- ============================================================

-- Anonymous/Public: SELECT only values for active products
DROP POLICY IF EXISTS "product_option_values_select_policy" ON public.product_option_values;
CREATE POLICY "product_option_values_select_policy"
  ON public.product_option_values
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_options po
      JOIN public.products p ON p.id = po.product_id
      WHERE po.id = product_option_values.option_id
      AND p.is_active = true
    )
  );

-- Admin: Full access to option values
DROP POLICY IF EXISTS "product_option_values_admin_all" ON public.product_option_values;
CREATE POLICY "product_option_values_admin_all"
  ON public.product_option_values
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================
-- STEP 4: PRODUCT VARIANTS POLICIES (NORMALIZED)
-- ============================================================

-- Anonymous/Public: SELECT only active variants of active products
DROP POLICY IF EXISTS "product_variants_select_policy" ON public.product_variants;
CREATE POLICY "product_variants_select_policy"
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
      AND p.is_active = true
    )
  );

-- Admin: Full access to variants
DROP POLICY IF EXISTS "product_variants_admin_all" ON public.product_variants;
CREATE POLICY "product_variants_admin_all"
  ON public.product_variants
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================
-- STEP 5: PRODUCT VARIANT OPTION VALUES POLICIES (JUNCTION)
-- ============================================================

-- Anonymous/Public: SELECT only for active variants
DROP POLICY IF EXISTS "variant_option_values_select_policy" ON public.product_variant_option_values;
CREATE POLICY "variant_option_values_select_policy"
  ON public.product_variant_option_values
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_variants pv
      JOIN public.products p ON p.id = pv.product_id
      WHERE pv.id = product_variant_option_values.variant_id
      AND pv.is_active = true
      AND p.is_active = true
    )
  );

-- Admin: Full access to junction table
DROP POLICY IF EXISTS "variant_option_values_admin_all" ON public.product_variant_option_values;
CREATE POLICY "variant_option_values_admin_all"
  ON public.product_variant_option_values
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
  );

-- ============================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================

-- Product Options
GRANT SELECT ON public.product_options TO anon, authenticated;
GRANT ALL ON public.product_options TO authenticated;

-- Product Option Values
GRANT SELECT ON public.product_option_values TO anon, authenticated;
GRANT ALL ON public.product_option_values TO authenticated;

-- Product Variants (Normalized)
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO authenticated;

-- Product Variant Option Values (Junction)
GRANT SELECT ON public.product_variant_option_values TO anon, authenticated;
GRANT ALL ON public.product_variant_option_values TO authenticated;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'product_options',
    'product_option_values',
    'product_variants',
    'product_variant_option_values'
  )
ORDER BY tablename;

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'product_options',
    'product_option_values',
    'product_variants',
    'product_variant_option_values'
  )
ORDER BY tablename, policyname;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
SELECT 'RLS policies for multi-attribute variants created successfully!' as status;
SELECT 'Anonymous users: Can only SELECT active products and variants' as anon_access;
SELECT 'Admin users: Full access to all tables' as admin_access;
