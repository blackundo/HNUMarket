import { ProductCard } from "@/components/product/product-card";
import { storefrontProductsApi } from "@/lib/api/storefront-products";
import { storefrontCategoriesApi } from "@/lib/api/storefront-categories";
import { storefrontHomepageSectionsApi } from "@/lib/api/homepage-sections";
import { transformProducts, transformCategories } from "@/lib/helpers/transform-api-data";
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesBar } from "@/components/home/categories-bar";
import { HomepageSection } from "@/components/home/homepage-section";
import Link from "next/link";
import { Zap } from "lucide-react";

// ISR: Regenerate page every 60 seconds (on-demand when data changes)
export const revalidate = 60; // Cache for 60 seconds, then revalidate in background

export default async function Home() {
  // Fetch data in parallel
  const [featuredProductsData, flashSaleProductsData, categoriesData, homepageSections] =
    await Promise.all([
      storefrontProductsApi.getFeaturedProducts(8).catch((err) => {
        console.error('[Homepage] Failed to fetch featured products:', err.message);
        return [];
      }),
      storefrontProductsApi.getFlashSaleProducts(8).catch((err) => {
        console.error('[Homepage] Failed to fetch flash sale products:', err.message);
        return [];
      }),
      storefrontCategoriesApi.getCategories().catch((err) => {
        console.error('[Homepage] Failed to fetch categories:', err.message);
        return [];
      }),
      storefrontHomepageSectionsApi.getHomepageSections().catch((err) => {
        console.error('[Homepage] Failed to fetch homepage sections:', err.message);
        return [];
      }),
    ]);

  const featuredProducts = transformProducts(featuredProductsData);
  const flashSaleProducts = transformProducts(flashSaleProductsData);
  const categories = transformCategories(categoriesData);

  return (
    <div>
      {/* Hero Section with Categories Sidebar */}
      <HeroSection categories={categories} />

      {/* Categories Bar - Mobile/Tablet alternative view */}
      <div className="lg:hidden">
        <CategoriesBar categories={categories} />
      </div>

      {/* Flash Sale */}
      {flashSaleProducts.length > 0 && (
        <section className="py-8 sm:py-12">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 fill-yellow-400 text-yellow-400" />
                <span>Flash Sale</span>
              </h2>
              <Link href="/flash-sale" className="text-primary hover:underline text-sm sm:text-base transition-colors duration-200">
                Xem tất cả
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {flashSaleProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-8 sm:py-12 bg-gray-50">
          <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Sản Phẩm Nổi Bật</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Homepage Sections - Admin-controlled */}
      {homepageSections.map((section) => (
        <HomepageSection key={section.id} section={section} />
      ))}
    </div>
  );
}
