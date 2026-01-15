'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import { ProductCard } from '@/components/product/product-card';
import { LayoutConfig } from '@/lib/api/homepage-sections';
import type { Product } from '@/types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface ProductCarouselProps {
  products: Product[];
  config: LayoutConfig;
}

export function ProductCarousel({ products, config }: ProductCarouselProps) {
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [swiper, setSwiper] = useState<SwiperType | null>(null);

  if (products.length === 0) {
    return null;
  }

  // Responsive slides per view based on config.columns
  const desktopColumns = config.columns || 4;
  const tabletColumns = Math.min(desktopColumns, 3); // Max 3 on tablet
  const mobileColumns = 2; // Always 2 on mobile
  const autoplayDelay = config.autoplay_delay || 3000; // Default 3 seconds

  return (
    <div className="relative group/carousel">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={16}
        slidesPerView={mobileColumns}
        breakpoints={{
          640: {
            slidesPerView: mobileColumns,
            spaceBetween: 16,
          },
          768: {
            slidesPerView: tabletColumns,
            spaceBetween: 16,
          },
          1024: {
            slidesPerView: Math.min(desktopColumns, 4),
            spaceBetween: 16,
          },
          1280: {
            slidesPerView: desktopColumns,
            spaceBetween: 16,
          },
        }}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={products.length > desktopColumns}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onSwiper={(swiper) => {
          setSwiper(swiper);
          // Update navigation
          if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
          }
        }}
        className="!pb-12"
      >
        {products.map((product) => (
          <SwiperSlide key={product.id}>
            <ProductCard product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <button
        ref={prevRef}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>
      <button
        ref={nextRef}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>
    </div>
  );
}
