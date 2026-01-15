'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Auto-generate breadcrumb items from pathname
 * /admin/products/edit -> [Admin, Products, Edit]
 */
const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  // Remove leading/trailing slashes and split
  const segments = pathname.split('/').filter(Boolean);

  // Map segments to labels
  const labelMap: Record<string, string> = {
    admin: 'Admin',
    dashboard: 'Dashboard',
    products: 'Products',
    posts: 'Posts',
    orders: 'Orders',
    shipping: 'Shipping',
    settings: 'Settings',
    create: 'Add New',
    edit: 'Edit',
    categories: 'Categories',
  };

  const breadcrumbs: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    // Don't add href for last item or if it's a dynamic route (UUID pattern)
    const isLast = index === segments.length - 1;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);

    breadcrumbs.push({
      label: isUuid ? 'Detail' : label,
      href: isLast || isUuid ? undefined : currentPath,
    });
  });

  return breadcrumbs;
};

export function Breadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm font-admin" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-1 text-sidebar-textMuted" />
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-sidebar-textMuted hover:text-sidebar-text transition-colors cursor-pointer"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`${
                    isLast ? 'text-sidebar-text font-medium' : 'text-sidebar-textMuted'
                  }`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
