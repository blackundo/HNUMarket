'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { ProductCard } from '@/components/product/product-card';
import type { Product } from '@/types';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';

interface FlashSaleSectionProps {
    products: Product[];
}

interface QuickCountdownProps {
    value: number;
    label: string;
}

function TimerBlock({ value, label }: QuickCountdownProps) {
    return (
        <div className="flex flex-col items-center justify-center bg-primary text-white rounded-md w-14 h-16 shadow-sm overflow-hidden relative">
            <div key={value} className="absolute top-1 sm:top-1.5 inset-x-0 flex justify-center animate-in slide-in-from-top-full duration-500 ease-out">
                <span className="text-3xl font-bold leading-none tabular-nums" suppressHydrationWarning>
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-sm font-medium opacity-90 leading-none absolute bottom-1.5 sm:bottom-2">
                {label}
            </span>
        </div>
    );
}

export function FlashSaleSection({ products }: FlashSaleSectionProps) {
    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const [swiper, setSwiper] = useState<SwiperType | null>(null);

    // Countdown Timer Logic (Randomized < 4 hours on mount)
    const [timeLeft, setTimeLeft] = useState({
        hours: Math.floor(Math.random() * 4),
        minutes: Math.floor(Math.random() * 60),
        seconds: Math.floor(Math.random() * 60),
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev; // Stop at 0
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);



    if (!products || products.length === 0) {
        return null;
    }

    // Responsive breakpoints (matching product-carousel.tsx and product-grid)
    const mobileColumns = 2;
    const tabletColumns = 3;
    const desktopColumns = 5; // Reference image shows 5 items

    return (
        <section className="py-8 sm:py-12 bg-red-100">
            <div className="max-w-screen mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8 w-full lg:w-auto">
                        <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                            Chớp thời cơ. Giá như mơ!
                        </h2>

                        <div className="flex items-center gap-3">
                            <span className="text-sm sm:text-base font-medium text-primary/80 hidden sm:inline-block">
                                Chương trình sẽ kết thúc sau
                            </span>
                            <div className="flex items-center gap-1.5">
                                <TimerBlock value={timeLeft.hours} label="Giờ" />
                                {/* <span className="font-bold text-primary animate-pulse pb-2">:</span> */}
                                <TimerBlock value={timeLeft.minutes} label="Phút" />
                                {/* <span className="font-bold text-primary animate-pulse pb-2">:</span> */}
                                <TimerBlock value={timeLeft.seconds} label="Giây" />
                            </div>
                        </div>
                    </div>

                    <Link href="/flash-sale" className="text-primary hover:text-primary/80 text-sm sm:text-base font-semibold transition-colors items-center gap-1 group whitespace-nowrap self-end lg:self-auto hidden md:flex">
                        Xem tất cả
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Carousel */}
                <div className="relative group/carousel">
                    <Swiper
                        modules={[Autoplay, Navigation]}
                        spaceBetween={12}
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
                                slidesPerView: 4,
                                spaceBetween: 16,
                            },
                            1280: {
                                slidesPerView: desktopColumns,
                                spaceBetween: 16,
                            },
                        }}
                        autoplay={{
                            delay: 4000,
                            disableOnInteraction: false,
                            pauseOnMouseEnter: true,
                        }}
                        observer={true}
                        observeParents={true}
                        loop={products.length > desktopColumns}
                        navigation={{
                            prevEl: prevRef.current,
                            nextEl: nextRef.current,
                        }}
                        onSwiper={(swiper) => {
                            setSwiper(swiper);
                            if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                                swiper.params.navigation.prevEl = prevRef.current;
                                swiper.params.navigation.nextEl = nextRef.current;
                                swiper.navigation.init();
                                swiper.navigation.update();
                            }
                        }}
                        className="!pb-2" // Adjust padding if dynamic bullets are used, currently removed pagination for cleaner look like reference
                    >
                        {products.map((product) => (
                            <SwiperSlide
                                key={product.id}
                                className="!w-[calc((100%-12px)/2)] sm:!w-[calc((100%-16px)/2)] md:!w-[calc((100%-32px)/3)] lg:!w-[calc((100%-48px)/4)] xl:!w-[calc((100%-64px)/5)]"
                            >
                                <ProductCard product={product} />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Navigation Buttons (Custom style) */}
                    <button
                        ref={prevRef}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-20 bg-white shadow-md border border-gray-100 rounded-full p-2 text-gray-700 hover:text-primary hover:border-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button
                        ref={nextRef}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-20 bg-white shadow-md border border-gray-100 rounded-full p-2 text-gray-700 hover:text-primary hover:border-primary transition-all duration-200 opacity-0 group-hover/carousel:opacity-100 disabled:opacity-0"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>

                {/* Mobile View All Button */}
                <div className="mt-6 flex justify-center md:hidden">
                    <Link href="/flash-sale" className="w-full sm:w-auto">
                        <div className="w-full sm:w-auto px-6 py-3 bg-white border border-primary text-primary rounded-lg font-semibold text-center hover:bg-primary hover:text-white transition-colors duration-300">
                            Xem tất cả
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
