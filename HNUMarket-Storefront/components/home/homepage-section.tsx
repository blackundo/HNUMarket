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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 group leading-none">
              {/* Decorative Accent */}
              <div className="w-1.5 h-6 bg-primary rounded-full transition-all duration-300 group-hover:h-7 group-hover:opacity-80" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight transition-colors group-hover:text-primary">
                {title}
              </h2>
            </div>

            {display.show_view_all_link && (
              <Link
                href={categoryLink}
                className="group flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-primary transition-colors duration-200"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
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
