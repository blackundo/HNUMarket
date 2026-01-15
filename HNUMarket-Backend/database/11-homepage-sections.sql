-- ============================================================
-- HNUMarket Database Migration: Homepage Sections
-- Version: 1.0
-- Purpose: Add homepage customization system
-- Author: Black Undo
-- Date: 2026-01-03
-- ============================================================

-- Create homepage_sections table
CREATE TABLE
IF NOT EXISTS public.homepage_sections
(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid
(),
  category_id UUID NOT NULL REFERENCES public.categories
(id) ON
DELETE CASCADE,
  display_order INT
NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  config JSONB NOT NULL DEFAULT '{
    "layout": {
      "row_count": 1,
      "display_style": "slider",
      "product_limit": 8,
      "columns": 4
    },
    "products": {
      "selected_product_ids": [],
      "auto_fill": {
        "enabled": true,
        "criteria": "newest",
        "exclude_out_of_stock": true
      }
    },
    "banner": {
      "enabled": false,
      "image_url": "",
      "link_url": "",
      "alt_text": "",
      "position": "right",
      "width_ratio": 30
    },
    "display": {
      "show_category_header": true,
      "custom_title": "",
      "show_view_all_link": true,
      "animation": "fade"
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW
(),
  updated_at TIMESTAMPTZ DEFAULT NOW
()
);

-- Add indexes for performance
CREATE INDEX
IF NOT EXISTS idx_homepage_sections_category
  ON public.homepage_sections
(category_id);

CREATE INDEX
IF NOT EXISTS idx_homepage_sections_active
  ON public.homepage_sections
(is_active)
  WHERE is_active = true;

CREATE INDEX
IF NOT EXISTS idx_homepage_sections_order
  ON public.homepage_sections
(display_order);

-- Add JSONB indexes for config queries
CREATE INDEX
IF NOT EXISTS idx_homepage_sections_config_layout
  ON public.homepage_sections USING GIN
((config->'layout'));

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_homepage_sections_updated_at
ON public.homepage_sections;
CREATE TRIGGER set_homepage_sections_updated_at
  BEFORE
UPDATE ON public.homepage_sections
  FOR EACH ROW
EXECUTE
FUNCTION public.handle_updated_at
();

-- Add comments for documentation
COMMENT ON TABLE public.homepage_sections IS 'Stores homepage section configurations with flexible JSONB layout and product selection';
COMMENT ON COLUMN public.homepage_sections.config IS 'JSONB configuration containing layout, products, banner, and display settings';
COMMENT ON COLUMN public.homepage_sections.display_order IS 'Order of sections on homepage (lower = higher priority)';

-- Success message
SELECT 'Homepage sections table created successfully!' as status;
