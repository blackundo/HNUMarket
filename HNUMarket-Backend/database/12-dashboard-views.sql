-- ============================================================
-- Dashboard Views (Sales, Orders, Products)
-- Created: 2026-01-03
-- Description: Analytics views for admin dashboard
-- Run: After schema + orders tables exist
-- ============================================================

-- ============================================================
-- 1) Daily sales (last 30 days, includes zero-sales days)
-- ============================================================
CREATE OR REPLACE VIEW daily_sales AS
WITH days AS (
  SELECT generate_series(
    (CURRENT_DATE - INTERVAL '29 days')::date,
    CURRENT_DATE::date,
    INTERVAL '1 day'
  )::date AS date
),
sales AS (
  SELECT
    date_trunc('day', created_at)::date AS date,
    COUNT(*) AS order_count,
    COALESCE(SUM(total), 0) AS revenue
  FROM public.orders
  WHERE status != 'cancelled'
    AND created_at >= (CURRENT_DATE - INTERVAL '29 days')
  GROUP BY 1
)
SELECT
  d.date,
  COALESCE(s.order_count, 0) AS order_count,
  COALESCE(s.revenue, 0) AS revenue
FROM days d
LEFT JOIN sales s ON s.date = d.date
ORDER BY d.date;

-- ============================================================
-- 2) Order status counts (includes zero counts)
-- ============================================================
CREATE OR REPLACE VIEW order_status_counts AS
WITH statuses AS (
  SELECT * FROM (VALUES
    ('pending', 1),
    ('confirmed', 2),
    ('processing', 3),
    ('shipped', 4),
    ('delivered', 5),
    ('cancelled', 6)
  ) AS s(status, sort_order)
),
counts AS (
  SELECT status, COUNT(*) AS count
  FROM public.orders
  GROUP BY status
)
SELECT
  s.status,
  COALESCE(c.count, 0) AS count
FROM statuses s
LEFT JOIN counts c ON c.status = s.status
ORDER BY s.sort_order;

-- ============================================================
-- 3) Top products by quantity sold
-- ============================================================
CREATE OR REPLACE VIEW top_products AS
SELECT
  oi.product_id AS id,
  COALESCE(p.name, oi.product_name) AS name,
  p.slug AS slug,
  COALESCE(SUM(oi.quantity), 0) AS total_sold,
  COALESCE(SUM(oi.total_price), 0) AS total_revenue
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
LEFT JOIN public.products p ON p.id = oi.product_id
WHERE o.status != 'cancelled'
  AND oi.product_id IS NOT NULL
GROUP BY oi.product_id, p.name, oi.product_name, p.slug
ORDER BY total_sold DESC, total_revenue DESC
LIMIT 10;

-- ============================================================
-- 4) Low stock products (<= 10 units)
-- ============================================================
CREATE OR REPLACE VIEW low_stock_products AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.stock,
  img.url AS image_url
FROM public.products p
LEFT JOIN LATERAL (
  SELECT url
  FROM public.product_images
  WHERE product_id = p.id
  ORDER BY display_order ASC, created_at ASC
  LIMIT 1
) img ON true
WHERE p.is_active = true
  AND p.stock <= 10
ORDER BY p.stock ASC, p.updated_at DESC
LIMIT 10;

-- ============================================================
-- COMPLETE
-- ============================================================
SELECT 'Dashboard views created successfully!' as status;
