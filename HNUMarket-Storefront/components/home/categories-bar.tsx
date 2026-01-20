'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { storefrontCategoriesApi, type StorefrontCategory } from '@/lib/api/storefront-categories';
import { getImageUrl } from '@/lib/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount?: number;
}

interface CategoriesBarProps {
  categories?: Category[]; // Optional: có thể truyền từ server-side hoặc component tự fetch
}

export function CategoriesBar({ categories: propCategories }: CategoriesBarProps) {
  const [categories, setCategories] = useState<Category[]>(propCategories || []);
  const [loading, setLoading] = useState(!propCategories);
  const shouldAutoplay = categories.length > 1;
  const autoplayPlugin = useRef(
    Autoplay({
      delay: 2500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  // Fetch categories from API nếu không có prop
  useEffect(() => {
    if (propCategories) {
      setCategories(propCategories);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const apiCategories = await storefrontCategoriesApi.getCategories();

        // Transform API data sang format của component
        const transformedCategories: Category[] = apiCategories.map((cat: StorefrontCategory) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image: cat.image_url,
          productCount: cat.product_count || 0,
        }));

        if (isMounted) {
          setCategories(transformedCategories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        if (isMounted) {
          // Giữ empty array nếu fetch fail
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [propCategories]);

  // Ẩn component nếu không có dữ liệu
  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-200">
      <div className="max-w-screen mx-auto px-4 lg:py-4">
        {loading ? (
          <div className="overflow-x-auto pb-3">
            <div className="flex gap-3 sm:gap-3 lg:gap-4 w-full">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="flex-1 basis-[32%] sm:basis-[24%] lg:basis-[16%] xl:basis-[13%] 2xl:basis-[11%] min-w-[140px] sm:min-w-[150px] lg:min-w-[160px] rounded-xl border border-gray-200 bg-gray-100/70 h-[190px] sm:h-[210px] animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : (
          <Carousel
            opts={{
              align: 'start',
              dragFree: true,
              loop: true,
            }}
            className="w-full pb-4"
            plugins={shouldAutoplay ? [autoplayPlugin.current] : undefined}
          >
            <CarouselContent className="-ml-3 sm:-ml-3 lg:-ml-4">
              {categories.map((category) => (
                <CarouselItem
                  key={category.id}
                  className="pl-3 sm:pl-3 lg:pl-4 basis-[32%] sm:basis-[24%] lg:basis-[16%] xl:basis-[13%] 2xl:basis-[11%] min-w-[140px] sm:min-w-[150px] lg:min-w-[160px]"
                >
                  <Link
                    href={`/categories/${category.slug}`}
                    className="group rounded-sm border border-gray-200 bg-white shadow-sm hover:border-primary transition-colors duration-150 flex flex-col items-center px-4 sm:px-5 py-4 h-full"
                  >
                    <div className="flex-1 flex items-center justify-center w-full">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28">
                        {category.image ? (
                          <Image
                            src={getImageUrl(category.image)}
                            alt={category.name}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg" />
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm sm:text-base font-semibold text-gray-900 text-center leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-150">
                      {category.name}
                    </p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        )}
      </div>
    </section>
  );
}
