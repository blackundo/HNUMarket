"use client";

import { Product } from "@/types";
import { ProductCard } from "@/components/product/product-card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface ProductSliderRowProps {
    products: Product[];
}

export function ProductSliderRow({ products }: ProductSliderRowProps) {
    if (!products || products.length === 0) return null;
    return (
        <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            // plugins={[
            //     Autoplay({
            //         delay: 3000,
            //         stopOnInteraction: true,
            //     }),
            // ]}
            className="w-full"
        >
            <CarouselContent className="-ml-4">
                {products.map((product) => (
                    <CarouselItem key={product.id} className="pl-4 basis-auto">
                        <div className="w-[270px]">
                            <ProductCard product={product} is_slider={true} />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-0 -translate-x-4 w-12 h-12 bg-white shadow-xl border-gray-200 hover:bg-primary hover:text-white hover:border-primary" />
            <CarouselNext className="right-0 translate-x-4 w-12 h-12 bg-white shadow-xl border-gray-200 hover:bg-primary hover:text-white hover:border-primary" />
        </Carousel>
    );
}


