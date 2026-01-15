"use client";

import { cn } from "@/lib/utils";
import { ProductOption, ProductOptionValue } from "@/types";
import { Check } from "lucide-react";

interface VariantSelectorProps {
  options: ProductOption[];
  selectedAttributes: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
  getAvailableValues: (optionName: string) => Set<string>;
  isValueSelected: (optionName: string, value: string) => boolean;
  isValueAvailable: (optionName: string, value: string) => boolean;
  className?: string;
}

/**
 * Variant Selector Component
 *
 * Displays product attributes (Color, Size, etc.) with selectable options.
 * Automatically disables unavailable combinations based on stock.
 *
 * @example
 * <VariantSelector
 *   options={product.options}
 *   selectedAttributes={selectedAttributes}
 *   onSelect={selectAttribute}
 *   getAvailableValues={getAvailableValues}
 *   isValueSelected={isValueSelected}
 *   isValueAvailable={isValueAvailable}
 * />
 */
export function VariantSelector({
  options,
  selectedAttributes,
  onSelect,
  getAvailableValues,
  isValueSelected,
  isValueAvailable,
  className,
}: VariantSelectorProps) {
  if (!options || options.length === 0) {
    return null;
  }

  // Sort options by position
  const sortedOptions = [...options].sort((a, b) => a.position - b.position);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {sortedOptions.map((option) => (
        <div key={option.id} className="flex flex-col gap-2">
          {/* Option Label - Style cũ */}
          <span className="text-base font-semibold text-gray-900">
            {option.name}:
          </span>

          {/* Option Values - Style cũ từ product-info.tsx */}
          <div className="flex flex-wrap gap-3">
            {option.values.map((value) => {
              const isSelected = isValueSelected(option.name, value.value);
              const isAvailable = isValueAvailable(option.name, value.value);

              return (
                <button
                  key={value.id}
                  onClick={() => onSelect(option.name, value.value)}
                  disabled={!isAvailable}
                  className={`
                    relative px-4 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                    ${isSelected
                      ? 'bg-primary/5 border-2 border-primary shadow-sm'
                      : 'bg-white border border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }
                    ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className="font-medium text-xs sm:text-sm">
                    {value.value}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-white">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Compact Variant Selector (for product cards/quick view)
 *
 * Shows only first few options inline
 */
interface CompactVariantSelectorProps {
  options: ProductOption[];
  maxOptions?: number;
  selectedAttributes: Record<string, string>;
  onSelect: (optionName: string, value: string) => void;
  isValueSelected: (optionName: string, value: string) => boolean;
  isValueAvailable: (optionName: string, value: string) => boolean;
  className?: string;
}

export function CompactVariantSelector({
  options,
  maxOptions = 1,
  selectedAttributes,
  onSelect,
  isValueSelected,
  isValueAvailable,
  className,
}: CompactVariantSelectorProps) {
  if (!options || options.length === 0) {
    return null;
  }

  const displayOptions = options.slice(0, maxOptions);

  return (
    <div className={cn("space-y-2", className)}>
      {displayOptions.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          <span className="text-xs text-gray-600 min-w-[50px]">
            {option.name}:
          </span>
          <div className="flex gap-1">
            {option.values.slice(0, 4).map((value) => {
              const isSelected = isValueSelected(option.name, value.value);
              const isAvailable = isValueAvailable(option.name, value.value);

              return (
                <button
                  key={value.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(option.name, value.value);
                  }}
                  disabled={!isAvailable}
                  className={cn(
                    "w-6 h-6 rounded text-xs font-medium",
                    "transition-all duration-150",
                    isSelected && "bg-blue-500 text-white shadow-sm",
                    !isSelected && isAvailable && "bg-gray-100 text-gray-700 hover:bg-gray-200",
                    !isAvailable && "bg-gray-50 text-gray-300 cursor-not-allowed"
                  )}
                >
                  {value.value.charAt(0)}
                </button>
              );
            })}
            {option.values.length > 4 && (
              <span className="text-xs text-gray-400 px-1">
                +{option.values.length - 4}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
