-- ============================================================
-- HNUMarket Database Utilities
-- Các script tiện ích để quản lý database
-- ============================================================


-- ############################################################
-- 1. SET ADMIN USER
-- Thay 'your-email@example.com' bằng email của bạn
-- ############################################################

-- Cách 1: Set admin bằng email
/*
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
*/

-- Cách 2: Set admin bằng user ID
/*
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'your-user-uuid';
*/


-- ############################################################
-- 2. FIX MISSING PROFILES
-- Tạo profile cho users đã có trong auth.users nhưng chưa có profile
-- ############################################################

-- Chạy khi cần fix profiles thiếu
/*
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  'user',
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;
*/


-- ############################################################
-- 3. CHECK DATABASE STATUS
-- ############################################################

-- Kiểm tra trigger
SELECT 
  'Trigger on_auth_user_created:' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Kiểm tra function is_admin
SELECT 
  'Function is_admin:' as check_item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Đếm records
SELECT 'Auth Users' as table_name, COUNT(*)::text as count FROM auth.users
UNION ALL SELECT 'Profiles' as table_name, COUNT(*)::text as count FROM public.profiles
UNION ALL SELECT 'Categories' as table_name, COUNT(*)::text as count FROM public.categories
UNION ALL SELECT 'Products' as table_name, COUNT(*)::text as count FROM public.products
UNION ALL SELECT 'Posts' as table_name, COUNT(*)::text as count FROM public.posts
UNION ALL SELECT 'Orders' as table_name, COUNT(*)::text as count FROM public.orders;

-- Kiểm tra users thiếu profile
SELECT 
  'Users missing profiles:' as check_item,
  COUNT(*)::text as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;


-- ############################################################
-- 4. LIST ALL USERS
-- ############################################################

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;


-- ############################################################
-- 5. LIST ALL ADMINS
-- ############################################################

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.created_at
FROM public.profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at DESC;


-- ############################################################
-- 6. RESET PRODUCT DATA (DANGER!)
-- Xóa và seed lại dữ liệu products
-- ############################################################

/*
-- ⚠️ CHỈ CHẠY KHI CẦN RESET DATA
TRUNCATE public.product_images CASCADE;
TRUNCATE public.product_variants CASCADE;
TRUNCATE public.products CASCADE;
TRUNCATE public.categories CASCADE;

-- Sau đó chạy lại 03-seed-data.sql
*/


-- ############################################################
-- 7. RECREATE TRIGGER (nếu trigger bị lỗi)
-- ############################################################

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/


-- ############################################################
-- 8. BACKUP COMMANDS (chạy từ terminal)
-- ############################################################

/*
# Export database
pg_dump -h your-project.supabase.co -U postgres -d postgres > backup.sql

# Import database  
psql -h your-project.supabase.co -U postgres -d postgres < backup.sql
*/

