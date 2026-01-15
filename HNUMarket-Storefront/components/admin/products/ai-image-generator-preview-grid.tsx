'use client';

import { RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GeneratedImage } from '@/types/ai-image-generation';
import { getThemeName } from '@/types/ai-image-generation';

interface AIImageGeneratorPreviewGridProps {
  images: GeneratedImage[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onRegenerate?: (index: number) => void;
  loading?: boolean;
  loadingCount?: number;
}

export function AIImageGeneratorPreviewGrid({
  images,
  selectedIndex,
  onSelect,
  onRegenerate,
  loading = false,
  loadingCount = 4,
}: AIImageGeneratorPreviewGridProps) {
  // Calculate total count for display
  const totalCount = loading ? images.length + loadingCount : images.length;
  const displayCount = totalCount || loadingCount;
  const isSingleImage = displayCount === 1 && !loading;

  // Determine grid columns based on image count
  const getGridCols = () => {
    if (displayCount === 1) return 'grid-cols-1';
    if (displayCount === 2) return 'grid-cols-2';
    if (displayCount <= 4) return 'grid-cols-2 sm:grid-cols-3';
    if (displayCount <= 9) return 'grid-cols-3 sm:grid-cols-4';
    return 'grid-cols-4 sm:grid-cols-5'; // For 10+ images
  };

  return (
    <div className={`grid ${getGridCols()} gap-3 ${isSingleImage ? 'max-w-sm mx-auto' : ''}`}>
      {images.map((image, index) => (
        <div
          key={index}
          className={`
            relative aspect-square rounded-md overflow-hidden cursor-pointer group
            border-2 transition-all
            ${selectedIndex === index
              ? 'border-admin-primary ring-2 ring-primary/20'
              : 'border-gray-200 hover:border-admin-primary/50'
            }
          `}
          onClick={() => onSelect(index)}
        >
          <img
            src={image.url}
            alt={`Generated image ${index + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Theme Badge */}
          <div className="absolute top-1.5 left-1.5">
            <Badge variant="destructive" className="text-xs font-semibold shadow-md">
              {getThemeName(image.theme)}
            </Badge>
          </div>

          {selectedIndex === index && (
            <div className="absolute top-1.5 right-1.5 bg-admin-primary rounded-full p-1">
              <Check className="h-3 w-3 text-white" />
            </div>
          )}

          {onRegenerate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(index);
              }}
              className="
                absolute bottom-1.5 right-1.5 p-1.5 bg-white/90 hover:bg-white
                rounded text-gray-700 hover:text-admin-primary transition-colors
                opacity-0 group-hover:opacity-100
              "
              title="Regenerate this image"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}

      {loading && (
        <>
          {[...Array(loadingCount)].map((_, i) => (
            <div
              key={`loading-${i}`}
              className="aspect-square rounded-md bg-gray-100 animate-pulse flex items-center justify-center"
            >
              <span className="text-gray-400 text-xs">Đang tạo {i + 1}/{loadingCount}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
