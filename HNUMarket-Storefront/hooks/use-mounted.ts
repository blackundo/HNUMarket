'use client';

import { useState, useEffect } from 'react';

/**
 * Hook to detect if component has mounted on client.
 * Useful for avoiding hydration mismatches with components that generate
 * dynamic IDs (like Radix UI components).
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
