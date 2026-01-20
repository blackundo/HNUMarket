import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HomepageSectionWithProducts } from '@/lib/api/homepage-sections';
import { ProductSliderRow } from '@/components/product/product-slider-row';
import { ProductGridWithBanner } from './product-grid-with-banner';
import { ProductCarousel } from './product-carousel';
import { transformProducts } from '@/lib/helpers/transform-api-data';

interface HomepageSectionProps {
  section: HomepageSectionWithProducts;
}

export function HomepageSection({ section }: HomepageSectionProps) {
  const { config, category, products: rawProducts } = section;
  const { layout, display, banner } = config;

  // Transform products to match expected format
  const products = transformProducts(rawProducts);

  // Don't render if no products
  if (!products || products.length === 0) {
    return null;
  }

  // Determine title
  const title = display.custom_title || category?.name || 'Sản phẩm';

  // Determine category link
  const categoryLink = category?.slug ? `/categories/${category.slug}` : '#';

  return (
    <section className="py-6 sm:py-8">
      <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {display.show_category_header && (
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="relative group cursor-pointer">
              <h2 className="text-lg sm:text-xl lg:text-2xl tracking-tight font-semibold">
                {title}
              </h2>
              <div className="absolute -bottom-2 left-0 w-16 group-hover:w-full h-1 bg-gradient-to-r from-primary to-primary/30 rounded-full transition-all duration-500 ease-out" />
            </div>

            {display.show_view_all_link && (
              <Link href={categoryLink} className="text-primary text-xs sm:text-sm transition-colors duration-200">
                <button className="group relative px-5 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-full font-semibold text-sm transition-all duration-300 flex items-center gap-2 overflow-hidden">
                  <span className="relative">Xem tất cả</span>
                  <ChevronRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Content - Based on layout configuration */}
        {layout.row_count === 1 ? (
          // 1 Row Layout - Horizontal Slider or Carousel
          layout.display_style === 'carousel' ? (
            <ProductCarousel products={products} config={layout} />
          ) : (
            <ProductSliderRow products={products} />
          )
        ) : (
          // 2 Row Layout - Grid with optional Banner
          <ProductGridWithBanner
            products={products}
            banner={banner?.enabled ? banner : undefined}
            columns={layout.columns || 4}
          />
        )}
      </div>
    </section>
  );
}
