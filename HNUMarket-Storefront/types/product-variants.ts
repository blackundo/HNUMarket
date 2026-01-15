/**
 * Product Variants Types (Normalized Multi-Attribute Schema)
 *
 * Supports flexible multi-attribute combinations (Color, Size, Material, etc.)
 */

/**
 * Product Option Value
 * Represents a single value for an attribute (e.g., "Red", "Blue", "S", "M", "L")
 */
export interface ProductOptionValue {
  id: string;
  value: string; // e.g., "Red", "Blue", "S", "M", "L"
}

/**
 * Product Option
 * Represents an attribute for a product (e.g., "Color", "Size", "Material")
 */
export interface ProductOption {
  id: string;
  name: string; // e.g., "Color", "Size", "Material"
  position: number; // Display order
  values: ProductOptionValue[];
}

/**
 * Product Variant (Normalized)
 * Represents a SKU with specific attribute combinations
 */
export interface ProductVariantNormalized {
  id: string;
  sku?: string; // Optional barcode/SKU
  price: number; // Variant price in KRW
  originalPrice?: number; // Original price for discount display
  stock: number; // Inventory for this variant
  imageUrl?: string; // Variant-specific image
  isActive: boolean;
  attributes: Record<string, string>; // e.g., { "Color": "Blue", "Size": "M" }
  createdAt: string;
  updatedAt: string;
}

/**
 * Product with normalized variants
 */
export interface ProductWithNormalizedVariants {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number; // Base/minimum price
  originalPrice?: number; // For discount display
  categoryId?: string;
  stock: number; // Total stock (auto-calculated from variants)
  rating: number;
  reviewCount: number;
  sold: number;
  location?: string;
  badges?: string[];
  specifications?: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;

  // Related data
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  images: Array<{
    id: string;
    url: string;
    altText?: string;
    displayOrder: number;
  }>;

  // Multi-attribute variant system
  options: ProductOption[];
  variants: ProductVariantNormalized[];
}

/**
 * Helper type: Variant selection state
 * Used for tracking user's selected attributes in the UI
 */
export interface VariantSelection {
  selectedAttributes: Record<string, string>; // e.g., { "Color": "Blue", "Size": "M" }
  selectedVariant?: ProductVariantNormalized; // Matched variant
  isComplete: boolean; // All required attributes selected
}

/**
 * Helper: Get discount percentage
 */
export function getDiscountPercentage(price: number, originalPrice?: number): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

/**
 * Helper: Find variant by attribute combination
 */
export function findVariantByAttributes(
  variants: ProductVariantNormalized[],
  selectedAttributes: Record<string, string>
): ProductVariantNormalized | undefined {
  return variants.find((variant) => {
    // Check if all selected attributes match this variant
    return Object.entries(selectedAttributes).every(
      ([attrName, attrValue]) => variant.attributes[attrName] === attrValue
    );
  });
}

/**
 * Helper: Get available values for an attribute based on current selection
 * This helps disable unavailable options in the UI
 */
export function getAvailableOptionValues(
  variants: ProductVariantNormalized[],
  optionName: string,
  currentSelection: Record<string, string>
): Set<string> {
  const availableValues = new Set<string>();

  variants.forEach((variant) => {
    // Check if variant matches current selection (excluding the option we're checking)
    const matches = Object.entries(currentSelection).every(
      ([key, value]) => key === optionName || variant.attributes[key] === value
    );

    // Handle both camelCase (isActive) and snake_case (is_active) from backend
    const isActive = (variant as any).isActive ?? (variant as any).is_active ?? true;

    if (matches && variant.stock > 0 && isActive) {
      const value = variant.attributes[optionName];
      if (value) {
        availableValues.add(value);
      }
    }
  });

  return availableValues;
}

/**
 * Helper: Get price range from variants
 */
export function getVariantPriceRange(
  variants: ProductVariantNormalized[]
): { min: number; max: number } | null {
  if (!variants.length) return null;

  const prices = variants.map((v) => v.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

/**
 * Helper: Check if product has any stock available
 */
export function hasStock(product: ProductWithNormalizedVariants): boolean {
  if (product.variants.length === 0) {
    return product.stock > 0;
  }
  return product.variants.some((v) => v.stock > 0 && v.isActive);
}
