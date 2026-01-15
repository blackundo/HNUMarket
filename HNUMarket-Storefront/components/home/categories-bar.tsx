'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { storefrontCategoriesApi, type StorefrontCategory } from '@/lib/api/storefront-categories';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';

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
  const [isSticky, setIsSticky] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollThreshold = 50; // Minimum scroll distance to trigger state change
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const isSmallDevice = isMobile || isTablet;

  // Track if component has mounted to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch categories from API nếu không có prop
  useEffect(() => {
    if (propCategories) {
      setCategories(propCategories);
      return;
    }

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

        setCategories(transformedCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Giữ empty array nếu fetch fail
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [propCategories]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Check if sticky
      if (sectionRef.current && placeholderRef.current) {
        const rect = placeholderRef.current.getBoundingClientRect();
        // Sử dụng threshold khác nhau tùy theo kích thước màn hình
        const stickyThreshold = isTablet || isDesktop ? 64 : 122;
        setIsSticky(rect.top <= stickyThreshold);
      }

      // Detect header visibility với threshold để tránh flickering
      const scrollDiff = Math.abs(currentScrollY - lastScrollY.current);

      if (currentScrollY < 10) {
        setIsHeaderHidden(false);
      } else if (scrollDiff > scrollThreshold) {
        // Chỉ thay đổi state khi scroll đủ xa
        if (currentScrollY > lastScrollY.current) {
          setIsHeaderHidden(true); // Scroll down -> header hidden
        } else if (currentScrollY < lastScrollY.current) {
          setIsHeaderHidden(false); // Scroll up -> header visible
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isTablet, isDesktop]);

  // Truncate text helper
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // Calculate heights based on state
  const isCompact = isSticky && isHeaderHidden;
  const placeholderHeight = !isSticky ? 'h-0' : isCompact ? 'h-[100px] sm:h-[110px]' : 'h-[140px] sm:h-[160px]';

  // Ẩn component nếu không có dữ liệu
  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <>
      {/* Placeholder để giữ layout khi sticky */}
      <div ref={placeholderRef} className={placeholderHeight} />

      <section
        ref={sectionRef}
        className={cn(
          "transition-all duration-150 z-10",
          !isSticky && "relative py-2 sm:py-3 bg-white",
          isSticky && isCompact && "fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-md border-b border-white/20",
          isSticky && !isCompact && "fixed left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg border-b border-white/30",
          isSticky && !isCompact && (isTablet || isDesktop ? "top-[64px]" : "top-[122px]")
        )}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title - ẩn khi sticky */}
          {!isSticky && (
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-1 text-center">
              Danh mục sản phẩm
            </h2>
          )}

          {/* Categories Grid */}
          {loading ? (
            <div className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-2 justify-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-[80px] h-[120px] sm:w-[90px] sm:h-[140px] bg-gray-200 rounded-full animate-pulse"
                />
              ))}
            </div>
          ) : (
            <Carousel
              opts={{
                // Use safe SSR defaults, then update after mount to avoid hydration mismatch
                align: mounted && isSmallDevice ? 'start' : 'center',
                loop: mounted && isSmallDevice,
                dragFree: true,
              }}
              className="w-full"
            >
              {/* Use CSS responsive class for justify-center to avoid hydration mismatch */}
              <CarouselContent className="-ml-3 sm:-ml-4 lg:-ml-6 py-2 lg:justify-center">
                {categories.map((category) => (
                  <CarouselItem key={category.id} className="pl-3 sm:pl-4 lg:pl-6 basis-auto">
                    <Link
                      href={`/categories/${category.slug}`}
                      className="group block"
                    >
                      <div className={`flex flex-col items-center ${!isSticky ? 'pt-8 pb-5' : isCompact ? 'pt-2 py-3' : 'pt-4 py-3'}`}>
                        {/* Category Pill */}
                        <div className={`
                    bg-white rounded-full shadow-md overflow-visible
                    transition-all duration-300 ease-out
                    group-hover:shadow-xl group-hover:scale-105
                    ${!isSticky
                            ? 'w-[80px] h-[120px] sm:w-[90px] sm:h-[140px] lg:w-[100px] lg:h-[150px]'
                            : isCompact
                              ? 'w-[60px] h-[75px] sm:w-[65px] sm:h-[80px]'
                              : 'w-[70px] h-[90px] sm:w-[75px] sm:h-[95px]'
                          }
                  `}>
                          {/* Image Circle at top */}
                          <div className={`
                        mx-auto bg-yellow-100 rounded-full flex items-center justify-center overflow-hidden relative
                        transition-all duration-300
                        group-hover:shadow-xl group-hover:scale-110
                        ${!isSticky
                              ? 'w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mt-3 group-hover:-translate-y-8'
                              : isCompact
                                ? 'w-8 h-8 sm:w-9 sm:h-9 mt-1.5 group-hover:-translate-y-3'
                                : 'w-10 h-10 sm:w-11 sm:h-11 mt-2 group-hover:-translate-y-4'
                            }
                      `}>
                            {category.image ? (
                              <Image
                                src={category.image}
                                alt={category.name}
                                fill
                                className="object-cover rounded-full"
                                sizes="(max-width: 640px) 48px, (max-width: 1024px) 56px, 64px"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-300" />
                            )}
                          </div>

                          {/* Text Content */}
                          <div className={`
                      px-2 text-center
                      ${!isSticky
                              ? 'mt-2 sm:mt-3'
                              : isCompact
                                ? 'mt-0.5'
                                : 'mt-1'
                            }
                    `}>
                            <p className={`
                        font-semibold text-gray-900 leading-tight
                        ${!isSticky
                                ? 'text-xs sm:text-sm line-clamp-2'
                                : isCompact
                                  ? 'text-[9px] sm:text-[10px] line-clamp-1'
                                  : 'text-[10px] sm:text-xs line-clamp-1'
                              }
                      `}>
                              {truncateText(category.name, !isSticky ? 12 : isCompact ? 6 : 8)}
                            </p>
                            {!isSticky && category.description && (
                              <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2 leading-tight">
                                {truncateText(category.description, 20)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          )}
        </div>
      </section>
    </>
  );
}

