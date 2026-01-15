'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingCart,
  Truck,
  Settings,
  ChevronDown,
  List,
  Plus,
  FolderTree,
  ImageIcon,
  Trash2,
  LayoutGrid,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  {
    label: 'Sản phẩm',
    href: '/admin/products',
    icon: Package,
    children: [
      { label: 'Tất cả sản phẩm', href: '/admin/products', icon: List },
      { label: 'Thùng rác', href: '/admin/products/trash', icon: Trash2 },
      { label: 'Thêm mới', href: '/admin/products/new', icon: Plus },
    ],
  },
  {
    label: 'Danh mục',
    href: '/admin/categories',
    icon: FolderTree,
    children: [
      { label: 'Tất cả danh mục', href: '/admin/categories', icon: List },
      { label: 'Thêm mới', href: '/admin/categories/new', icon: Plus },
    ],
  },
  {
    label: 'Banner trang chủ',
    href: '/admin/hero-slides',
    icon: ImageIcon,
    children: [
      { label: 'Tất cả banner', href: '/admin/hero-slides', icon: List },
      { label: 'Thêm mới', href: '/admin/hero-slides/new', icon: Plus },
    ],
  },
  {
    label: 'Cài đặt trang chủ',
    href: '/admin/homepage-settings',
    icon: LayoutGrid,
  },
  {
    label: 'Bài viết',
    href: '/admin/posts',
    icon: FileText,
    children: [
      { label: 'Tất cả bài viết', href: '/admin/posts', icon: List },
      { label: 'Thêm mới', href: '/admin/posts/new', icon: Plus },
    ],
  },
  {
    label: 'Trang nội dung',
    href: '/admin/pages',
    icon: FileText,
    children: [
      { label: 'Tất cả trang', href: '/admin/pages', icon: List },
      { label: 'Thêm mới', href: '/admin/pages/new', icon: Plus },
    ],
  },
  { label: 'Đơn hàng', href: '/admin/orders', icon: ShoppingCart },
  { label: 'Vận chuyển', href: '/admin/shipping', icon: Truck },
  { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => {
      if (prev.includes(menuId)) {
        return prev.filter((id) => id !== menuId);
      }
      return [...prev, menuId];
    });
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
              HM
            </div>
            <span className="text-base font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              HNUMarket
            </span>
          </Link>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const hasActiveChild = item.children?.some(
                  (child) => pathname === child.href || pathname.startsWith(`${child.href}/`)
                ) || false;
                const isOpen = expandedMenus.includes(item.href) || hasActiveChild;

                if (item.children && item.children.length > 0) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        onClick={() => toggleMenu(item.href)}
                        isActive={isActive || hasActiveChild}
                        tooltip={item.label}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                        <ChevronDown
                          className={cn(
                            'ml-auto h-4 w-4 transition-transform group-data-[collapsible=icon]:hidden',
                            isOpen ? 'rotate-180' : ''
                          )}
                        />
                      </SidebarMenuButton>
                      {isOpen && (
                        <SidebarMenuSub>
                          {item.children.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={isChildActive}
                                >
                                  <Link href={child.href} onClick={handleLinkClick}>
                                    <child.icon />
                                    <span>{child.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} onClick={handleLinkClick}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarRail />
    </>
  );
}
