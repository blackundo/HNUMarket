/**
 * Google Analytics helper utilities
 *
 * Provides typed functions to interact with GA4:
 * - gaEvent: Send custom events
 * - gaSet: Set user properties or config
 *
 * All functions include guards for production-only, GA_ID existence, and gtag availability.
 */

// Type definitions for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

/**
 * Check if Google Analytics is available and ready
 */
function isGAReady(): boolean {
  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  // Check if GA_ID is configured
  if (!process.env.NEXT_PUBLIC_GA_ID) {
    return false;
  }

  // Check if gtag is available
  if (typeof window === 'undefined' || !window.gtag) {
    return false;
  }

  return true;
}

/**
 * Send a custom event to Google Analytics
 *
 * @param name - Event name (e.g., 'button_click', 'add_to_cart')
 * @param params - Event parameters
 *
 * @example
 * gaEvent('button_click', { button_name: 'checkout' })
 */
export function gaEvent(name: string, params?: Record<string, unknown>): void {
  if (!isGAReady()) {
    return;
  }

  try {
    window.gtag!('event', name, params);
  } catch (error) {
    // Silently fail in production to avoid breaking the app
    if (process.env.NODE_ENV === 'development') {
      console.error('GA event error:', error);
    }
  }
}

/**
 * Set user properties or configuration in Google Analytics
 *
 * @param params - Configuration parameters
 *
 * @example
 * gaSet({ user_id: '12345', user_type: 'premium' })
 */
export function gaSet(params: Record<string, unknown>): void {
  if (!isGAReady()) {
    return;
  }

  try {
    window.gtag!('set', params);
  } catch (error) {
    // Silently fail in production to avoid breaking the app
    if (process.env.NODE_ENV === 'development') {
      console.error('GA set error:', error);
    }
  }
}
