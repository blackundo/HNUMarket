'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { storefrontHeroSlidesApi, type HeroSlide } from '@/lib/api/hero-slides';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

export function HeroSlider() {
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch hero slides from API
    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const slides = await storefrontHeroSlidesApi.getActiveHeroSlides();
                setHeroSlides(slides);
            } catch (error) {
                console.error('Failed to fetch hero slides:', error);
                // Keep empty array on error
            } finally {
                setLoading(false);
            }
        };

        fetchSlides();
    }, []);

    // Don't render if loading or no slides
    if (loading || heroSlides.length === 0) {
        return null;
    }

    return (
        <section className="relative py-4 sm:py-6">
            <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">
                <Swiper
                    modules={[Autoplay, Pagination, Navigation]}
                    spaceBetween={12}
                    slidesPerView={1}
                    centeredSlides={false}
                    breakpoints={{
                        0: {
                            slidesPerView: 1,
                            spaceBetween: 12,
                        },
                        640: {
                            slidesPerView: 2,
                            spaceBetween: 12,
                        },
                        1024: {
                            slidesPerView: 3,
                            spaceBetween: 16,
                        },
                    }}
                    loop={heroSlides.length > 3}
                    autoplay={{
                        delay: 4000,
                        disableOnInteraction: false,
                    }}
                    pagination={{
                        clickable: true,
                        dynamicBullets: false,
                    }}
                    navigation={{
                        prevEl: prevRef.current,
                        nextEl: nextRef.current,
                    }}
                    className="hero-swiper"
                    onSwiper={setSwiper}
                    onInit={(swiper) => {
                        if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }
                    }}
                >
                    {heroSlides.map((slide, index) => {
                        const isClickable = slide.link && slide.link !== '#';
                        const SlideContent = (
                            <div className={`
                  relative aspect-[16/9] rounded-xl overflow-hidden shadow-md
                  ${isClickable ? 'hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer' : 'cursor-default'}
                  bg-gradient-to-br ${slide.gradient || 'from-gray-400 to-gray-500'}
                `}>
                                {slide.image_url ? (
                                    <Image
                                        src={slide.image_url}
                                        alt={slide.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        priority={index === 0}
                                    />
                                ) : (
                                    /* Decorative pattern khi không có hình */
                                    <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-2 right-2 w-12 h-12 sm:w-16 sm:h-16 border-2 border-white/50 rounded-full" />
                                        <div className="absolute bottom-4 left-4 w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/30 rounded-full" />
                                    </div>
                                )}

                                {/* Content - only show if no image */}
                                {!slide.image_url && (
                                    <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-5">
                                        <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg drop-shadow-lg mb-0.5 sm:mb-1">
                                            {slide.title}
                                        </h3>
                                        {slide.subtitle && (
                                            <p className="text-white/90 text-xs sm:text-sm drop-shadow">
                                                {slide.subtitle}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );

                        return (
                            <SwiperSlide key={slide.id}>
                                {isClickable ? (
                                    <Link href={slide.link} className="block">
                                        {SlideContent}
                                    </Link>
                                ) : (
                                    SlideContent
                                )}
                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </div>

            {/* Custom Navigation Buttons */}
            <button
                ref={prevRef}
                onClick={() => swiper?.slidePrev()}
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-md rounded-full p-1.5 sm:p-2 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" strokeWidth={2.5} />
            </button>
            <button
                ref={nextRef}
                onClick={() => swiper?.slideNext()}
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white shadow-md rounded-full p-1.5 sm:p-2 transition-all duration-200 hover:scale-110 active:scale-95 min-h-[32px] min-w-[32px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center"
                aria-label="Next slide"
            >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" strokeWidth={2.5} />
            </button>

            <style jsx global>{`
                .hero-swiper {
                    width: 100%;
                    padding-bottom: 2rem;
                }
                
                .hero-swiper .swiper-pagination {
                    bottom: 0 !important;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                }
                
                .hero-swiper .swiper-pagination-bullet {
                    width: 10px !important;
                    height: 10px !important;
                    background: #d1d5db !important;
                    opacity: 1 !important;
                    border-radius: 50% !important;
                    transition: all 0.3s ease !important;
                    cursor: pointer;
                }
                
                .hero-swiper .swiper-pagination-bullet:hover {
                    background: #9ca3af !important;
                    transform: scale(1.2);
                }
                
                .hero-swiper .swiper-pagination-bullet-active {
                    background: #22c55e !important;
                    width: 24px !important;
                    border-radius: 5px !important;
                }
            `}</style>
        </section>
    );
}

