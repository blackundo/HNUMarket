"use client";

import Link from "next/link";
import { Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchInput } from "@/components/search/search-input";
import { useAuth } from "@/contexts/auth-context";
import { UserMenu } from "@/components/auth/user-menu";
import { QuickCart } from "@/components/cart/quick-cart";
import { useMounted } from "@/hooks/use-mounted";
import { Skeleton } from "@/components/ui/skeleton";

export function Navbar() {
  const { user, logout } = useAuth();
  const mounted = useMounted();


  return (
    <header className="w-full z-40">
      {/* 1. Top Green Promotion Bar */}
      <div className={`hidden md:block bg-primary text-white text-xs py-2 px-4`}>
        <div className="max-w-screen mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <p className="font-medium truncate">
            Giao hàng MIỄN PHÍ & giảm 40% cho 3 đơn hàng tiếp theo! Đặt đơn hàng đầu tiên của bạn ngay bây giờ.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="opacity-80">Bạn cần trợ giúp? Hãy gọi cho chúng tôi:</span>
            <span className="font-bold">+258 3268 21485</span>
          </div>
        </div>
      </div>

      {/* 2. Secondary Top Bar (Utility Links) */}
      <div className={`bg-white border-b border-gray-200 py-2 px-4 text-xs text-gray-500 hidden md:block`}>
        <div className="max-w-screen mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Link href="/about" className="hover:text-primary transition-colors">Về chúng tôi</Link>
              <Link href="/account" className="hover:text-primary transition-colors">Tài khoản</Link>
              <Link href="/wishlist" className="hover:text-primary transition-colors">Yêu thích</Link>
            </div>
            <span className="w-px h-3 bg-gray-300"></span>
            <p>Chúng tôi mở cửa mỗi ngày từ 9:00 sáng - 02:00 đêm</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/order-check" className="hover:text-primary transition-colors">Kiểm tra đơn hàng</Link>
          </div>
        </div>
      </div>

      {/* 3. Main Header (Logo, Search, Actions) */}
      <div className="bg-white py-6 px-4">
        <div className="max-w-screen mx-auto flex items-center justify-between gap-4 sm:gap-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <h1 className="text-3xl font-bold text-primary">
              HNUMARKET
            </h1>
          </Link>

          {/* Search Input - Desktop */}
          <div className="hidden md:block flex-1 max-w-2xl">
            <SearchInput customClass="w-full" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <Link href="/wishlist">
              <Button variant="outline" className={`hidden sm:flex h-12 gap-2 border-gray-200 rounded-sm hover:border-primary hover:text-accent-foreground group`}>
                <div className="relative">
                  <Heart className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
                </div>
                <span className="hidden lg:inline text-sm font-semibold text-gray-700 group-hover:text-accent-foreground">Yêu thích</span>
              </Button>
            </Link>

            {/* User Menu */}
            <div className="h-12">
              {mounted ? (
                <UserMenu user={user} onLogout={logout} customTrigger={true} />
              ) : (
                <Skeleton className="hidden sm:flex h-12 w-[120px] rounded-sm" />
              )}
            </div>

            {/* Cart */}
            <div className="h-12">
              {mounted ? (
                <QuickCart customTrigger={true} />
              ) : (
                <Skeleton className="hidden sm:flex h-12 w-[120px] rounded-sm" />
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <div className="md:hidden ml-2">
              {mounted ? (
                <MobileMenu />
              ) : (
                <Skeleton className="h-10 w-10 rounded-md" />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <SearchInput />
        </div>
      </div>

      {/* 4. Navigation Menu Bar */}
      <div className="bg-gray-100 border-t border-b border-gray-200 hidden md:block">
        <div className="max-w-screen mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Main Nav Links */}
            <nav className="flex items-center gap-8 text-sm font-bold text-gray-800 uppercase tracking-wide">
              <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
              <Link href="/about" className="hover:text-primary transition-colors">Về chúng tôi</Link>

              <div className="group relative cursor-pointer flex items-center gap-1 hover:text-primary transition-colors">
                Sản phẩm <ChevronDown className="w-4 h-4" />
                {/* Dropdown placeholder */}
              </div>

              <div className="group relative cursor-pointer flex items-center gap-1 hover:text-primary transition-colors">
                Tin tức <ChevronDown className="w-4 h-4" />
              </div>

              <Link href="/about" className="hover:text-primary transition-colors">Giới thiệu</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Liên hệ</Link>
            </nav>

            {/* Right Side Callouts */}
            <div className="flex items-center">
              <span className="text-sm font-semibold mr-4 text-gray-700">Sản phẩm bán chạy</span>
              <div className={`bg-primary text-white px-8 py-4 h-14 flex items-center gap-2 font-bold text-sm relative -mr-4 clip-path-slant`}>
                <span className="uppercase">Giảm ngay 30%</span>
                <span className="bg-white text-primary text-[10px] px-2 py-0.5 rounded uppercase font-extrabold">Sale</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
