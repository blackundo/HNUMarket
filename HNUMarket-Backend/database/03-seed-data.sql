-- HNUMarket Seed Data
-- Run this AFTER schema and RLS policies

-- ================================================
-- SEED CATEGORIES
-- ================================================
INSERT INTO categories
  (slug, name, display_order, is_active)
VALUES
  ('nau-san', 'Nấu Sẵn', 1, true),
  ('do-che-bien', 'Đồ Chế Biến', 2, true),
  ('banh-sua', 'Bánh - Sữa', 3, true),
  ('do-uong', 'Đồ Uống', 4, true)
ON CONFLICT
(slug) DO NOTHING;

-- ================================================
-- SEED PRODUCTS
-- ================================================
-- Products for "Nấu Sẵn" category
INSERT INTO products
  (slug, name, description, price, original_price, category_id, stock, rating, review_count, sold, location, badges, specifications, is_active, is_featured)
VALUES
  -- Nấu Sẵn
  (
    'com-ga-nuong',
    'Cơm Gà Nướng',
    'Cơm gà nướng thơm ngon, gà được ướp gia vị đậm đà, ăn kèm với cơm trắng và rau sống. Món ăn tiện lợi, chỉ cần hâm nóng là dùng được ngay.',
    15000, -- 15,000 KRW
    18000, -- 18,000 KRW (original)
    (SELECT id
    FROM categories
    WHERE slug = 'nau-san'
LIMIT 1),
    50,
    4.5,
    128,
    342,
    'TP.HCM',
    ARRAY['new', 'freeship'],
    '{"Khối lượng": "350g", "Bảo quản": "Tủ đông -18°C", "Hạn sử dụng": "6 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'pho-bo-chay',
    'Phở Bò Chay',
    'Phở bò chay đậm đà, nước dùng trong veo, thịt bò mềm thơm. Sản phẩm đông lạnh, giữ nguyên hương vị truyền thống Việt Nam.',
    12000, -- 12,000 KRW
    15000,
-- 15,000 KRW
(SELECT id
FROM categories
WHERE slug = 'nau-san'
LIMIT 1),
    75,
    4.7,
    256,
    892,
    'TP.HCM',
    ARRAY['best-seller', 'freeship'],
    '{"Khối lượng": "400g", "Bảo quản": "Tủ đông -18°C", "Hạn sử dụng": "6 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'bun-cha-ha-noi',
    'Bún Chả Hà Nội',
    'Bún chả Hà Nội chính hiệu với thịt nướng thơm lừng, nước mắm chua ngọt đậm đà. Món ăn đặc trưng của Hà Nội, đóng gói tiện lợi.',
    14000, -- 14,000 KRW
    17000,
-- 17,000 KRW
(SELECT id
FROM categories
WHERE slug = 'nau-san'
LIMIT 1),
    60,
    4.6,
    189,
    567,
    'Hà Nội',
    ARRAY['authentic', 'new'],
    '{"Khối lượng": "380g", "Bảo quản": "Tủ đông -18°C", "Hạn sử dụng": "6 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),
(
    'banh-mi-thit-nuong',
    'Bánh Mì Thịt Nướng',
    'Bánh mì giòn tan với thịt nướng thơm lừng, pate béo ngậy, rau củ tươi ngon. Bánh mì Việt Nam nổi tiếng thế giới.',
    8000, -- 8,000 KRW
    10000,
-- 10,000 KRW
(SELECT id
FROM categories
WHERE slug = 'nau-san'
LIMIT 1),
    100,
    4.8,
    445,
    1234,
    'TP.HCM',
    ARRAY['best-seller', 'flash-sale'],
    '{"Khối lượng": "200g", "Bảo quản": "Tủ đông -18°C", "Hạn sử dụng": "3 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),

-- Đồ Chế Biến
(
    'nuoc-mam-phu-quoc',
    'Nước Mắm Phú Quốc',
    'Nước mắm Phú Quốc nguyên chất, đậm đà hương vị biển. Sản phẩm truyền thống Việt Nam, không pha trộn, không chất bảo quản.',
    25000, -- 25,000 KRW
    30000,
-- 30,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-che-bien'
LIMIT 1),
    200,
    4.9,
    567,
    2345,
    'Phú Quốc',
    ARRAY['authentic', 'best-seller'],
    '{"Dung tích": "500ml", "Độ đạm": "40°N", "Bảo quản": "Nơi khô ráo, tránh ánh sáng", "Hạn sử dụng": "24 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'tuong-ot-sriracha',
    'Tương Ớt Sriracha',
    'Tương ớt Sriracha cay nồng, hương vị đậm đà. Phù hợp với mọi món ăn, từ phở đến bánh mì, pizza.',
    6000, -- 6,000 KRW
    8000,
-- 8,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-che-bien'
LIMIT 1),
    150,
    4.6,
    234,
    789,
    'TP.HCM',
    ARRAY['freeship'],
    '{"Dung tích": "250ml", "Độ cay": "Trung bình", "Bảo quản": "Nơi khô ráo", "Hạn sử dụng": "18 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),
(
    'gia-vi-pho-bo',
    'Gia Vị Phở Bò',
    'Bộ gia vị phở bò đầy đủ: quế, thảo quả, hoa hồi, gừng, hành khô. Giúp bạn nấu phở bò chuẩn vị Việt Nam tại nhà.',
    18000, -- 18,000 KRW
    22000,
-- 22,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-che-bien'
LIMIT 1),
    80,
    4.7,
    156,
    456,
    'Hà Nội',
    ARRAY['authentic', 'new'],
    '{"Trọng lượng": "100g", "Thành phần": "Quế, thảo quả, hoa hồi, gừng, hành khô", "Bảo quản": "Nơi khô ráo", "Hạn sử dụng": "12 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),
(
    'bot-nem-ran',
    'Bột Nêm Ran',
    'Bột nêm ran đa dụng, tăng hương vị cho mọi món ăn. Sản phẩm không chứa bột ngọt, an toàn cho sức khỏe.',
    12000, -- 12,000 KRW
    15000,
-- 15,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-che-bien'
LIMIT 1),
    120,
    4.5,
    189,
    678,
    'TP.HCM',
    ARRAY['freeship'],
    '{"Trọng lượng": "500g", "Thành phần": "Muối, đường, bột tỏi, bột hành", "Bảo quản": "Nơi khô ráo", "Hạn sử dụng": "18 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),

-- Bánh - Sữa
(
    'banh-flan-viet-nam',
    'Bánh Flan Việt Nam',
    'Bánh flan mềm mịn, ngọt ngào với hương vani thơm lừng. Món tráng miệng yêu thích của người Việt, đóng hộp tiện lợi.',
    5000, -- 5,000 KRW
    6000,
-- 6,000 KRW
(SELECT id
FROM categories
WHERE slug = 'banh-sua'
LIMIT 1),
    200,
    4.6,
    234,
    890,
    'TP.HCM',
    ARRAY['new', 'freeship'],
    '{"Khối lượng": "120g", "Thành phần": "Sữa, trứng, đường, vani", "Bảo quản": "Tủ lạnh 2-8°C", "Hạn sử dụng": "7 ngày", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'sua-tuoi-tiet-trung',
    'Sữa Tươi Tiệt Trùng',
    'Sữa tươi tiệt trùng nguyên chất, giàu canxi và vitamin D. Sản phẩm không đường, phù hợp cho mọi lứa tuổi.',
    4000, -- 4,000 KRW
    5000,
-- 5,000 KRW
(SELECT id
FROM categories
WHERE slug = 'banh-sua'
LIMIT 1),
    300,
    4.7,
    345,
    1234,
    'Đà Lạt',
    ARRAY['best-seller', 'freeship'],
    '{"Dung tích": "1L", "Thành phần": "100% sữa tươi", "Bảo quản": "Tủ lạnh 2-8°C", "Hạn sử dụng": "10 ngày", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'banh-pia-soc-trang',
    'Bánh Pía Sóc Trăng',
    'Bánh pía Sóc Trăng truyền thống với nhân đậu xanh, sầu riêng, lòng đỏ trứng. Bánh mềm, ngọt vừa phải, đóng gói đẹp mắt.',
    35000, -- 35,000 KRW
    40000,
-- 40,000 KRW
(SELECT id
FROM categories
WHERE slug = 'banh-sua'
LIMIT 1),
    50,
    4.8,
    189,
    567,
    'Sóc Trăng',
    ARRAY['authentic', 'best-seller'],
    '{"Trọng lượng": "500g (10 cái)", "Thành phần": "Bột mì, đậu xanh, sầu riêng, trứng", "Bảo quản": "Nơi khô ráo", "Hạn sử dụng": "30 ngày", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'sua-chua-vinamilk',
    'Sữa Chua Vinamilk',
    'Sữa chua Vinamilk mát lạnh, bổ dưỡng với lợi khuẩn probiotic. Hương vị tự nhiên, không chất bảo quản.',
    3000, -- 3,000 KRW
    3500,
-- 3,500 KRW
(SELECT id
FROM categories
WHERE slug = 'banh-sua'
LIMIT 1),
    250,
    4.5,
    456,
    1789,
    'TP.HCM',
    ARRAY['best-seller', 'flash-sale'],
    '{"Dung tích": "100g", "Hương vị": "Tự nhiên", "Bảo quản": "Tủ lạnh 2-8°C", "Hạn sử dụng": "14 ngày", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),

-- Đồ Uống
(
    'ca-phe-phin-viet-nam',
    'Cà Phê Phin Việt Nam',
    'Cà phê phin Việt Nam đậm đà, thơm nồng. Hạt cà phê rang xay truyền thống, pha bằng phin tạo nên hương vị đặc trưng.',
    28000, -- 28,000 KRW
    35000,
-- 35,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-uong'
LIMIT 1),
    100,
    4.9,
    678,
    2345,
    'Buôn Ma Thuột',
    ARRAY['authentic', 'best-seller'],
    '{"Trọng lượng": "500g", "Loại": "Robusta", "Độ rang": "Vừa", "Bảo quản": "Nơi khô ráo, tránh ánh sáng", "Hạn sử dụng": "12 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    true
  ),
(
    'tra-dao-cam-sa',
    'Trà Đào Cam Sả',
    'Trà đào cam sả mát lạnh, thanh nhiệt. Kết hợp hương đào ngọt ngào, cam chua thanh và sả thơm. Đóng chai tiện lợi.',
    7000, -- 7,000 KRW
    9000,
-- 9,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-uong'
LIMIT 1),
    150,
    4.6,
    234,
    789,
    'TP.HCM',
    ARRAY['new', 'freeship'],
    '{"Dung tích": "500ml", "Thành phần": "Trà, đào, cam, sả", "Bảo quản": "Nơi khô ráo, mát mẻ", "Hạn sử dụng": "12 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),
(
    'nuoc-mia-tuoi',
    'Nước Mía Tươi',
    'Nước mía tươi ép trực tiếp, ngọt thanh tự nhiên. Giải khát mùa hè, bổ sung năng lượng nhanh chóng.',
    5000, -- 5,000 KRW
    6000,
-- 6,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-uong'
LIMIT 1),
    180,
    4.7,
    345,
    1234,
    'TP.HCM',
    ARRAY['freeship'],
    '{"Dung tích": "500ml", "Thành phần": "100% nước mía tươi", "Bảo quản": "Tủ lạnh 2-8°C", "Hạn sử dụng": "3 ngày", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  ),
(
    'bia-saigon-special',
    'Bia Sài Gòn Special',
    'Bia Sài Gòn Special đậm đà, hương vị đặc trưng Việt Nam. Bia lager nhẹ nhàng, dễ uống, phù hợp mọi dịp.',
    8000, -- 8,000 KRW
    10000,
-- 10,000 KRW
(SELECT id
FROM categories
WHERE slug = 'do-uong'
LIMIT 1),
    120,
    4.5,
    189,
    567,
    'TP.HCM',
    ARRAY['authentic'],
    '{"Dung tích": "330ml", "Độ cồn": "4.3%", "Bảo quản": "Nơi khô ráo, mát mẻ", "Hạn sử dụng": "12 tháng", "Xuất xứ": "Việt Nam"}'::jsonb,
    true,
    false
  )
ON CONFLICT
(slug) DO NOTHING;

-- ================================================
-- SEED PRODUCT IMAGES
-- ================================================
-- Note: Image URLs should be updated with actual image paths
INSERT INTO product_images
  (product_id, url, alt_text, display_order)
SELECT
  p.id,
  '/images/products/' || p.slug || '-1.jpg',
  p.name || ' - Hình ảnh 1',
  0
FROM products p
WHERE p.slug IN (
  'com-ga-nuong', 'pho-bo-chay', 'bun-cha-ha-noi', 'banh-mi-thit-nuong',
  'nuoc-mam-phu-quoc', 'tuong-ot-sriracha', 'gia-vi-pho-bo', 'bot-nem-ran',
  'banh-flan-viet-nam', 'sua-tuoi-tiet-trung', 'banh-pia-soc-trang', 'sua-chua-vinamilk',
  'ca-phe-phin-viet-nam', 'tra-dao-cam-sa', 'nuoc-mia-tuoi', 'bia-saigon-special'
);

-- ================================================
-- SEED PRODUCT VARIANTS (Unit System)
-- ================================================
-- Add unit-based variants for grocery products

-- Cơm Gà Nướng - Gói, Lốc 6, Thùng 24
INSERT INTO product_variants
  (product_id, name, display_name, type, value, unit, conversion_rate, stock, price)
  SELECT
    p.id,
    'Gói 1',
    '1 Gói',
    'unit',
    '1',
    'goi',
    1,
    100,
    15000  -- Base price
  FROM products p
  WHERE p.slug = 'com-ga-nuong'
UNION ALL
  SELECT
    p.id,
    'Lốc 6',
    'Lốc 6 gói',
    'unit',
    '6',
    'loc',
    6,
    20,
    85000  -- Bulk discount: 15000*6 = 90000, save 5000 (5.5% off)
  FROM products p
  WHERE p.slug = 'com-ga-nuong'
UNION ALL
  SELECT
    p.id,
    'Thùng 24',
    'Thùng 24 gói',
    'unit',
    '24',
    'thung',
    24,
    5,
    340000  -- Bulk discount: 15000*24 = 360000, save 20000 (5.5% off)
  FROM products p
  WHERE p.slug = 'com-ga-nuong'

-- Nước Mắm Phú Quốc - Chai nhỏ, Chai lớn
UNION ALL
  SELECT
    p.id,
    'Chai 250ml',
    'Chai 250ml',
    'unit',
    '250ml',
    'chai',
    1,
    50,
    18000
  FROM products p
  WHERE p.slug = 'nuoc-mam-phu-quoc'
UNION ALL
  SELECT
    p.id,
    'Chai 500ml',
    'Chai 500ml',
    'unit',
    '500ml',
    'chai',
    2,
    30,
    34000  -- 18000*2 = 36000, save 2000 (5.5% off)
  FROM products p
  WHERE p.slug = 'nuoc-mam-phu-quoc'
UNION ALL
  SELECT
    p.id,
    'Chai 1L',
    'Chai 1 lít',
    'unit',
    '1l',
    'chai',
    4,
    15,
    66000  -- 18000*4 = 72000, save 6000 (8.3% off)
  FROM products p
  WHERE p.slug = 'nuoc-mam-phu-quoc';

-- ================================================
-- NOTE: Admin User Creation
-- ================================================
-- After creating a user via Supabase Auth (signup), run this to make them admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- ================================================
-- SEED PAGES
-- ================================================
INSERT INTO pages
  (slug, title, content, status, published_at)
VALUES
  (
    'about-us',
    'Về chúng tôi',
    '<p>Nội dung giới thiệu về thương hiệu, sứ mệnh và đội ngũ của bạn.</p>',
    'published',
    NOW()
  ),
  (
    'terms-of-service',
    'Điều khoản dịch vụ',
    '<p>Các điều khoản và điều kiện khi sử dụng dịch vụ của cửa hàng.</p>',
    'published',
    NOW()
  ),
  (
    'policy',
    'Chính sách',
    '<p>Các chính sách bán hàng, đổi trả, giao hàng và bảo mật thông tin.</p>',
    'published',
    NOW()
  )
ON CONFLICT (slug) DO NOTHING;
