'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, EffectFade, Pagination } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { storefrontHeroSlidesApi, type HeroSlide } from '@/lib/api/hero-slides';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

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

    // Show loading skeleton
    if (loading) {
        return (
            <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    // Don't render if no slides
    if (heroSlides.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            <Swiper
                modules={[Autoplay, Navigation, EffectFade, Pagination]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                centeredSlides={false}
                loop={heroSlides.length > 1}
                autoplay={{
                    delay: 4000,
                    disableOnInteraction: false,
                }}
                pagination={{
                    clickable: true,
                    bulletClass: 'swiper-pagination-bullet !bg-gray-400 !opacity-50',
                    bulletActiveClass: '!bg-primary !opacity-100',
                }}
                navigation={{
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                }}
                className="hero-swiper rounded-xl overflow-hidden"
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
                            relative aspect-[16/9] overflow-hidden shadow-md
                            ${isClickable ? 'hover:shadow-lg transition-all duration-300 cursor-pointer' : 'cursor-default'}
                            bg-gradient-to-br ${slide.gradient || 'from-gray-400 to-gray-500'}
                        `}>
                            {slide.image_url ? (
                                <Image
                                    src={slide.image_url}
                                    alt={slide.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, calc(100vw - 320px)"
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
                                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                                    <h3 className="text-white font-bold text-lg sm:text-2xl lg:text-3xl drop-shadow-lg mb-1 sm:mb-2">
                                        {slide.title}
                                    </h3>
                                    {slide.subtitle && (
                                        <p className="text-white/90 text-sm sm:text-base drop-shadow">
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

            {/* Custom Navigation Buttons */}
            <button
                ref={prevRef}
                onClick={() => swiper?.slidePrev()}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2.5 transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
            </button>
            <button
                ref={nextRef}
                onClick={() => swiper?.slideNext()}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white shadow-lg rounded-full p-2.5 transition-all duration-200 hover:scale-110 active:scale-95 hidden sm:flex items-center justify-center"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5 text-gray-700" strokeWidth={2.5} />
            </button>
        </div>
    );
}

