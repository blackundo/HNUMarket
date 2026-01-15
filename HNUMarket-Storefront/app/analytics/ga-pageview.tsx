'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * GA4 Page View Tracker for SPA navigation
 *
 * Automatically sends page_view events on route changes in Next.js App Router.
 * Prevents double page_view events by disabling auto page_view in gtag config.
 */
export function GAPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Guard if GA_ID is missing
    if (!process.env.NEXT_PUBLIC_GA_ID) {
      return;
    }

    // Guard if gtag is not ready
    if (typeof window === 'undefined' || !window.gtag) {
      return;
    }

    // Build full page_path with search params
    const search = searchParams?.toString();
    const pagePath = search ? `${pathname}?${search}` : pathname;

    // Build full URL for page_location
    const pageLocation = window.location.origin + pagePath;

    // Send page_view event
    window.gtag('event', 'page_view', {
      page_location: pageLocation,
      page_path: pagePath,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}
