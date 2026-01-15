import Script from 'next/script';

/**
 * Google Analytics 4 (GA4) initialization component
 *
 * This component loads the GA4 script and initializes gtag.
 * - Only loads in production
 * - Requires NEXT_PUBLIC_GA_ID environment variable
 * - Disables automatic page_view to avoid double-counting (handled by GAPageView component)
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Only load in production environment
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  // Guard if GA_ID is missing
  if (!gaId) {
    return null;
  }

  return (
    <>
      {/* Load gtag.js script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />

      {/* Initialize dataLayer and gtag */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}
