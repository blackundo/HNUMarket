"use client";

import { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  isModal?: boolean;
}

/**
 * Product image gallery with main image and thumbnails
 */
export function ProductImageGallery({
  images,
  productName,
  isModal = false,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Show placeholder if no images
  const displayImages = images.length > 0 ? images : ["/placeholder.jpg"];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 items-start",
        !isModal && "md:flex-row lg:sticky md:top-24"
      )}
    >
      {/* Thumbnails - Hiển thị bên trái trên desktop, dưới trên mobile (hoặc dưới nếu là modal) */}
      {displayImages.length > 1 && (
        <div
          className={cn(
            "flex gap-3 overflow-x-auto pb-2 flex-shrink-0",
            // Default styling (thumbnails left on desktop)
            !isModal && "md:flex-col md:overflow-x-visible md:w-20 md:pb-0 order-2 md:order-1",
            // Modal styling (always thumbnails below)
            isModal && "w-full order-2"
          )}
        >
          {displayImages.slice(0, 10).map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "aspect-square bg-gray-100 rounded-md overflow-hidden border-2 transition-colors flex-shrink-0",
                !isModal ? "w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20" : "w-16 h-16",
                selectedImageIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-gray-300"
              )}
            >
              {image === "/placeholder.jpg" ? (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
                  <Package className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                </div>
              ) : (
                <Image
                  src={image}
                  alt={`${productName} ${index + 1}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div
        className={cn(
          "w-full aspect-square bg-gray-100 rounded-lg overflow-hidden",
          !isModal ? "md:max-w-[500px] order-1 md:order-2" : "order-1"
        )}
      >
        {displayImages[selectedImageIndex] === "/placeholder.jpg" ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
            <Package className="w-24 h-24 text-gray-300" strokeWidth={1.5} />
          </div>
        ) : (
          <Image
            src={displayImages[selectedImageIndex]}
            alt={productName}
            width={600}
            height={600}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
