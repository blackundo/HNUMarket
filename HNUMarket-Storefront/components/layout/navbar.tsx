"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { QuickCart } from "@/components/cart/quick-cart";
import { SearchInput } from "@/components/search/search-input";
import { useAuth } from "@/contexts/auth-context";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

import { UserMenu } from "@/components/auth/user-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Package, Info, PenTool, Phone, Search, Cake } from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const mounted = useMounted();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full z-40 relative font-sans">
      <div className="bg-white relative z-20">

        {/* 1. Top Bar */}
        <div className="border-b border-dashed border-gray-300 bg-white">
          <div className="container mx-auto px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2">
            {/* Left: Hotline */}
            <div className="text-sm font-medium text-gray-500">
              Hotline: <span className="text-primary font-bold text-base">1900 6750</span>
            </div>

            {/* Right: Search + Auth (Desktop) */}
            <div className="hidden lg:flex items-center gap-6 w-full sm:w-auto">
              {/* Search Bar - Compact */}
              <div className="w-96">
                <SearchInput customClass="w-full" />
              </div>

              {/* Divider */}
              <div className="h-4 w-px bg-gray-200"></div>

              {/* Auth Links / User Menu */}
              <div className="flex h-4 items-center">
                {mounted ? (
                  <UserMenu user={user} onLogout={logout} customTrigger={true} />
                ) : (
                  <Skeleton className="hidden sm:flex h-4 w-[120px] rounded-sm" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Wrapper for Main Header */}
        <div className={cn(
          "transition-all duration-300",
          isScrolled
            ? "fixed top-0 left-0 right-0 z-50 bg-white shadow-md animate-slide-down"
            : "relative bg-white shadow-sm"
        )}>
          {/* 2. Main Header */}
          <div className={cn(
            "container mx-auto px-4 transition-all duration-300 py-3",
            isScrolled ? "sm:py-3" : "sm:py-6"
          )}>
            <div className="flex items-center justify-between gap-4">

              {/* Left: Menu Trigger (Mobile Only) */}
              <div className="lg:hidden flex-shrink-0 w-10">
                {mounted ? (
                  <MobileMenu className="flex hover:bg-primary rounded-full p-0 h-10 w-10 text-gray-600" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                )}
              </div>

              {/* Logo (Left on Desktop, Center on Mobile) */}
              <div className="flex-1 lg:flex-none flex justify-center lg:justify-start">
                <Link href="/" className="flex flex-col items-center lg:items-start group">
                  <div className="flex items-center gap-2">
                    {/* Placeholder Icon for Logo if desired, or just Text */}
                    <Cake className="w-8 h-8 text-primary mb-1" />
                    <div className="flex flex-col">
                      <h1 className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tighter group-hover:opacity-90 transition-opacity">
                        HNU<span className="text-primary">MARKET</span>
                      </h1>
                      <span className="text-[10px] text-gray-400 tracking-[0.2em] font-medium uppercase">
                        Asian Food Store
                      </span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Center: Navigation (Desktop Only) */}
              <nav className="hidden lg:flex items-center gap-8 mx-8">
                <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-orange-600 transition-colors">
                  <Home className="w-4 h-4" />
                  Trang chủ
                </Link>
                <div className="relative group cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
                  <Package className="w-4 h-4" />
                  Sản phẩm
                  {/* Dropdown would go here */}
                </div>
                <Link href="/about-us" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
                  <Info className="w-4 h-4" />
                  Giới thiệu
                </Link>
                <Link href="/blog" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
                  <PenTool className="w-4 h-4" />
                  Blog
                </Link>
                <Link href="#" className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                  Liên hệ
                </Link>
              </nav>

              {/* Right: Cart */}
              <div className="flex-shrink-0 flex justify-end">
                {mounted ? (
                  <QuickCart customTrigger={true} showText={true} />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {/* 3. Wavy Bottom Border */}
          <div className="absolute -bottom-2 left-0 right-0 h-2 z-20 overflow-hidden">
            <div className="w-full h-full bg-repeat-x" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 10' preserveAspectRatio='none'%3E%3Cpath d='M0,0 C6,10 14,10 20,0 Z' fill='%23ffffff'/%3E%3C/svg%3E")`,
              backgroundSize: '15px 100%'
            }}></div>
          </div>
        </div>

      </div>

      {/* Spacer to prevent layout jump when Main Header becomes fixed */}
      {isScrolled && <div className="h-[100px] lg:h-[88px]" />}
    </header>
  );
}
