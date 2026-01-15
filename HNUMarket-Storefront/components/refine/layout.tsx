'use client';

import { AdminSidebar } from '@/components/admin/layout/admin-sidebar';
import { AdminHeader } from '@/components/admin/layout/admin-header';
import { SidebarProvider } from '@/components/ui/sidebar';

/**
 * Refine Layout với Shadcn UI
 *
 * Sử dụng layout tùy chỉnh với Shadcn components thay vì MUI
 */
export function RefineLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider className="bg-gray-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}
