'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { Toaster } from 'sonner';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && (
        <Toaster position="top-right" richColors offset={{ top: 100 }} />
      )}
    </>
  );
}
