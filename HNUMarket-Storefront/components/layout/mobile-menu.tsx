"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Package, Smartphone, Laptop, ShirtIcon, Home, Sparkles, Dumbbell, Baby, User, LogOut, Settings, ShoppingBag } from "lucide-react";
import { storefrontCategoriesApi, type StorefrontCategory } from "@/lib/api/storefront-categories";
import { createClient } from "@/lib/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const categoryIcons = {
  "dien-thoai-phu-kien": Smartphone,
  "laptop-may-tinh": Laptop,
  "thoi-trang-nam": ShirtIcon,
  "thoi-trang-nu": Sparkles,
  "dien-gia-dung": Home,
  "my-pham-lam-dep": Sparkles,
  "the-thao-du-lich": Dumbbell,
  "do-choi-tre-em": Baby,
} as const;

export function MobileMenu() {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<StorefrontCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Use getUser() instead of getSession() for secure token validation
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        setUser(currentUser ?? null);

        // Check if user is admin
        if (currentUser && !error) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

          setIsAdmin(profile?.role === 'admin');
        }

        // Fetch categories
        const categoriesData = await storefrontCategoriesApi.getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      // Update admin status when auth changes
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/');
    router.refresh();
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-left">HNUMarket</SheetTitle>
          </SheetHeader>

          {/* User Info (if logged in) */}
          {user && (
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {/* Home */}
              <Link
                href="/"
                onClick={closeMenu}
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
              >
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>Trang chủ</span>
              </Link>

              {/* User Menu Items */}
              {user && (
                <>
                  <Link
                    href="/orders"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>Đơn hàng của tôi</span>
                  </Link>

                  <Link
                    href="/account/settings"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Cài đặt tài khoản</span>
                  </Link>

                  {isAdmin && (
                    <>
                      <Separator className="my-2" />
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-admin-primary"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="font-medium">Quản trị</span>
                      </Link>
                    </>
                  )}
                </>
              )}

              {/* Categories */}
              <Separator className="my-2" />
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Danh mục sản phẩm
                </h3>
                <div className="space-y-1">
                  {loading ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Đang tải...
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((category) => {
                      const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] || Package;
                      return (
                        <Link
                          key={category.id}
                          href={`/categories/${category.slug}`}
                          onClick={closeMenu}
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                          <span>{category.name}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Không có danh mục
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t mt-auto">
            {user ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            ) : (
              <Button
                asChild
                className="w-full"
              >
                <Link href="/auth/login" onClick={closeMenu}>
                  Đăng nhập
                </Link>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
