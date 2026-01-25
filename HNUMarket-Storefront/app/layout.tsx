import type { Metadata } from "next";
import { Suspense } from "react";
import { Montserrat, Poppins, Open_Sans } from "next/font/google";
import { ConditionalLayout } from "@/components/layout/conditional-layout";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { MobileCartDrawerProvider } from "@/contexts/mobile-cart-drawer-provider";
import { MobileCartDrawer } from "@/components/product/mobile-cart-drawer";
import { MobileCartBar } from "@/components/product/mobile-cart-bar";
import { GoogleAnalytics } from "./analytics/google-analytics";
import { GAPageView } from "./analytics/ga-pageview";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-montserrat",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const openSans = Open_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  // metadataBase tells Next.js what base URL to use for resolving relative URLs (like og:image)
  // This is required for Open Graph images to use production URL instead of localhost
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hnumarket.com"),
  title: "HNUMarket - Mua Sắm Trực Tuyến",
  description: "Nền tảng thương mại điện tử Việt Nam",
  openGraph: {
    title: "HNUMarket - Mua Sắm Trực Tuyến",
    description: "Nền tảng thương mại điện tử Việt Nam",
    images: [
      {
        url: "/images/meta-image.jpg",
        width: 1200,
        height: 630,
        alt: "HNUMarket",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HNUMarket - Mua Sắm Trực Tuyến",
    description: "Nền tảng thương mại điện tử Việt Nam",
    images: ["/images/meta-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/images/favicon/favicon.ico", sizes: "any" },
      { url: "/images/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/images/favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "android-chrome-192x192", url: "/images/favicon/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/images/favicon/android-chrome-512x512.png" },
    ],
  },
  manifest: "/images/favicon/site.webmanifest",
};

import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${montserrat.variable} ${poppins.variable} ${openSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <GoogleAnalytics />
        <Suspense fallback={null}>
          <GAPageView />
        </Suspense>
        <NuqsAdapter>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <MobileCartDrawerProvider>
                  <ConditionalLayout>{children}</ConditionalLayout>
                  <MobileCartDrawer />
                  <MobileCartBar />
                </MobileCartDrawerProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
