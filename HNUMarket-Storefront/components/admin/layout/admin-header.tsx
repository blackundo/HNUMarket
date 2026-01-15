'use client';

import { Bell } from 'lucide-react';
import { Breadcrumb } from './breadcrumb';
import { UserMenu } from './user-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-admin-border shadow-sm">
      <div className="h-16 flex items-center justify-between px-6">
        {/* Left section - Mobile menu toggle + Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle button */}
          <SidebarTrigger className="md:hidden h-9 w-9 rounded-lg hover:bg-sidebar-hover" />

          {/* Breadcrumb navigation */}
          <Breadcrumb />
        </div>

        {/* Right section - Notifications + User menu */}
        <div className="flex items-center gap-3">
          {/* Notification bell (optional) */}
          <button
            className="p-2 rounded-lg hover:bg-sidebar-hover transition-colors cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-admin-primary"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-sidebar-text" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-admin-error rounded-full"></span>
          </button>

          {/* User menu dropdown */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
