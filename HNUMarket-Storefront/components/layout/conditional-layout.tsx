'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { PolicyBanner } from './policy-banner';
import { Toaster } from 'sonner';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const isAuthRoute = pathname?.startsWith('/auth');

  return (
    <>
      {!isAdminRoute && !isAuthRoute && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!isAdminRoute && !isAuthRoute && <PolicyBanner />}
      {!isAdminRoute && !isAuthRoute && <Footer />}
      {!isAdminRoute && (
        <Toaster position="top-right" richColors offset={{ top: 100 }} />
      )}
    </>
  );
}
