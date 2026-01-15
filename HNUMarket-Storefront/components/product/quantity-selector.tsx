"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

/**
 * Quantity selector with + and - buttons
 */
export function QuantitySelector({
  quantity,
  onQuantityChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && value <= max) {
      onQuantityChange(value);
    }
  };

  return (
    <div className="flex items-center w-full bg-primary/5 rounded-full overflow-hidden h-12 sm:h-14 mt-3">
      <button
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="h-4 w-4 text-gray-700 stroke-2" />
      </button>
      <div className="flex-1 h-12 sm:h-14 flex items-center justify-center">
        <span className="text-xl font-semibold text-gray-900">{quantity}</span>
      </div>
      <button
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4 text-primary stroke-2" />
      </button>
    </div>
  );
}
