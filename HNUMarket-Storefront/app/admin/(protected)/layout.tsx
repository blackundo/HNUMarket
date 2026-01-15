import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RefineProvider } from '@/components/refine/provider';
import { AdminSidebar } from '@/components/admin/layout/admin-sidebar';
import { AdminHeader } from '@/components/admin/layout/admin-header';
import { SidebarProvider } from '@/components/ui/sidebar';

/**
 * Protected Admin Layout
 *
 * Wraps all protected admin pages with authentication check and sidebar navigation.
 * Redirects unauthenticated users to login page.
 * Verifies admin role from database.
 * Integrates Refine for admin functionality.
 *
 * @layout /admin/(protected)/*
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login');
  }

  // Verify admin role from database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Redirect to login if not admin
  if (profile?.role !== 'admin') {
    redirect('/admin/login?error=unauthorized');
  }

  return (
    <RefineProvider>
      <SidebarProvider className="bg-admin-background font-admin">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </RefineProvider>
  );
}
