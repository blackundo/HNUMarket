import { ProductCard } from '@/components/product/product-card';
import { BannerConfig } from '@/lib/api/homepage-sections';
import type { Product } from '@/types';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/image';

interface ProductGridWithBannerProps {
  products: Product[];
  banner?: BannerConfig;
  columns?: number;
}

export function ProductGridWithBanner({
  products,
  banner,
  columns = 4,
}: ProductGridWithBannerProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  // No banner - just grid
  if (!banner || !banner.enabled) {
    return (
      <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    );
  }

  // With banner
  const bannerWidth = banner.width_ratio || 30;
  const gridWidth = 100 - bannerWidth;

  const BannerContent = () => (
    <div
      className="relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 group"
      style={{ minHeight: '400px' }}
    >
      {banner.image_url ? (
        <img
          src={getImageUrl(banner.image_url)}
          alt={banner.alt_text || 'Banner'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="w-16 h-16 text-gray-400" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Banner - Left */}
      {banner.position === 'left' && (
        <div className="w-full lg:w-[30%] flex-shrink-0">
          {banner.link_url ? (
            <Link href={banner.link_url}>
              <BannerContent />
            </Link>
          ) : (
            <BannerContent />
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1">
        <div className={`grid ${gridCols} gap-3 sm:gap-4`}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Banner - Right */}
      {banner.position === 'right' && (
        <div className="w-full lg:w-[30%] flex-shrink-0">
          {banner.link_url ? (
            <Link href={banner.link_url}>
              <BannerContent />
            </Link>
          ) : (
            <BannerContent />
          )}
        </div>
      )}
    </div>
  );
}
