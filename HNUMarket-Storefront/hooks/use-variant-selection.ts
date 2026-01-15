"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ProductWithNormalizedVariants,
  ProductVariantNormalized,
  ProductOption,
  findVariantByAttributes,
  getAvailableOptionValues,
} from "@/types";

/**
 * Hook for managing multi-attribute variant selection
 *
 * Handles:
 * - Attribute selection state (auto-selects first value for each option by default)
 * - Finding matching variant
 * - Determining available options based on current selection
 * - Validation (all attributes selected)
 *
 * @param product - Product with normalized variants, or null if not a multi-attribute product
 *
 * @example
 * const {
 *   selectedAttributes,
 *   selectedVariant,
 *   isComplete,
 *   selectAttribute,
 *   getAvailableValues,
 *   reset
 * } = useVariantSelection(product);
 */
export function useVariantSelection(product: ProductWithNormalizedVariants | null) {
  // Calculate default attributes (first value of each option)
  const defaultAttributes = useMemo(() => {
    if (!product?.options?.length) return {};

    const defaults: Record<string, string> = {};
    product.options.forEach((option) => {
      if (option.values && option.values.length > 0) {
        defaults[option.name] = option.values[0].value;
      }
    });
    return defaults;
  }, [product?.options]);

  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>(defaultAttributes);

  // Reset to defaults when product changes
  useEffect(() => {
    setSelectedAttributes(defaultAttributes);
  }, [defaultAttributes]);

  /**
   * Find variant matching current selection
   */
  const selectedVariant = useMemo<ProductVariantNormalized | undefined>(() => {
    if (!product?.variants?.length) return undefined;
    return findVariantByAttributes(product.variants, selectedAttributes);
  }, [product?.variants, selectedAttributes]);

  /**
   * Check if all required attributes are selected
   */
  const isComplete = useMemo(() => {
    if (!product?.options?.length) return true;
    return product.options.every((option) => selectedAttributes[option.name] !== undefined);
  }, [product?.options, selectedAttributes]);

  /**
   * Get available values for a specific option based on current selection
   * This helps disable unavailable combinations in the UI
   */
  const getAvailableValues = useCallback(
    (optionName: string): Set<string> => {
      if (!product?.variants?.length) return new Set();
      return getAvailableOptionValues(product.variants, optionName, selectedAttributes);
    },
    [product?.variants, selectedAttributes]
  );

  /**
   * Select an attribute value
   */
  const selectAttribute = useCallback((optionName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  }, []);

  /**
   * Clear an attribute selection
   */
  const clearAttribute = useCallback((optionName: string) => {
    setSelectedAttributes((prev) => {
      const next = { ...prev };
      delete next[optionName];
      return next;
    });
  }, []);

  /**
   * Reset all selections to defaults (first value of each option)
   */
  const reset = useCallback(() => {
    setSelectedAttributes(defaultAttributes);
  }, [defaultAttributes]);

  /**
   * Check if a specific option value is available
   */
  const isValueAvailable = useCallback(
    (optionName: string, value: string): boolean => {
      const availableValues = getAvailableValues(optionName);
      return availableValues.has(value);
    },
    [getAvailableValues]
  );

  /**
   * Check if a specific option value is selected
   */
  const isValueSelected = useCallback(
    (optionName: string, value: string): boolean => {
      return selectedAttributes[optionName] === value;
    },
    [selectedAttributes]
  );

  return {
    // State
    selectedAttributes,
    selectedVariant,
    isComplete,

    // Actions
    selectAttribute,
    clearAttribute,
    reset,

    // Helpers
    getAvailableValues,
    isValueAvailable,
    isValueSelected,
  };
}
