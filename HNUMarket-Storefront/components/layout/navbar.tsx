"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { SearchInput } from "@/components/search/search-input";
import { useAuth } from "@/contexts/auth-context";
import { UserMenu } from "@/components/auth/user-menu";
import { QuickCart } from "@/components/cart/quick-cart";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Luôn hiện khi gần top trang
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else {
        // Scroll xuống -> ẩn, scroll lên -> hiện
        if (currentScrollY > lastScrollY.current) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY.current) {
          setIsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white border-b border-gray-200 transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile Menu - shown on mobile only */}
          <div className="md:hidden">
            <MobileMenu />
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary">
            <Image
              src="/images/sonmartlogo1.png"
              alt="SonMart Logo"
              width={40}
              height={40}
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            HNUMarket
          </Link>

          {/* Search - hidden on mobile, shown on sm+ */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <SearchInput />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <UserMenu user={user} onLogout={logout} />
            <QuickCart />
          </div>
        </div>

        {/* Mobile Search - shown on mobile only */}
        <div className="md:hidden pb-3">
          <SearchInput />
        </div>

        {/* Desktop navigation */}
        {/* <nav className="hidden md:flex gap-6 py-3 text-sm overflow-x-auto">
          <Link href="/" className="whitespace-nowrap hover:text-primary transition-colors">Trang chủ</Link>
          <Link href="/categories/dien-thoai-phu-kien" className="whitespace-nowrap hover:text-primary transition-colors">Điện thoại</Link>
          <Link href="/categories/laptop-may-tinh" className="whitespace-nowrap hover:text-primary transition-colors">Laptop</Link>
          <Link href="/categories/thoi-trang-nam" className="whitespace-nowrap hover:text-primary transition-colors">Thời trang Nam</Link>
          <Link href="/categories/thoi-trang-nu" className="whitespace-nowrap hover:text-primary transition-colors">Thời trang Nữ</Link>
          <Link href="/flash-sale" className="whitespace-nowrap text-primary font-bold hover:text-primary-600 transition-colors">Flash Sale</Link>
        </nav> */}
      </div>
    </header>
  );
}
