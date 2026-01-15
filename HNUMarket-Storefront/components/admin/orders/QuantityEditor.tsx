'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityEditorProps {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (newQuantity: number) => void;
  disabled?: boolean;
}

/**
 * Inline quantity editor with stepper controls
 * Used in order item cards for admin editing
 */
export function QuantityEditor({
  quantity,
  min = 1,
  max,
  onChange,
  disabled = false,
}: QuantityEditorProps) {
  const [localQuantity, setLocalQuantity] = useState(quantity);

  const handleDecrease = () => {
    if (localQuantity > min) {
      const newValue = localQuantity - 1;
      setLocalQuantity(newValue);
      onChange(newValue);
    }
  };

  const handleIncrease = () => {
    if (!max || localQuantity < max) {
      const newValue = localQuantity + 1;
      setLocalQuantity(newValue);
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= min && (!max || value <= max)) {
      setLocalQuantity(value);
      onChange(value);
    }
  };

  const handleInputBlur = () => {
    // Reset to min if invalid
    if (localQuantity < min) {
      setLocalQuantity(min);
      onChange(min);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDecrease}
        disabled={disabled || localQuantity <= min}
        className="h-8 w-8 p-0"
      >
        <Minus className="h-3 w-3" />
      </Button>

      <input
        type="number"
        value={localQuantity}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        min={min}
        max={max}
        className="w-16 h-8 text-center border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleIncrease}
        disabled={disabled || (max !== undefined && localQuantity >= max)}
        className="h-8 w-8 p-0"
      >
        <Plus className="h-3 w-3" />
      </Button>

      {max && (
        <span className="text-xs text-gray-500">
          / {max}
        </span>
      )}
    </div>
  );
}
