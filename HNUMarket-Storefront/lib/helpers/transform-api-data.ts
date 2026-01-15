/**
 * Transform API data (snake_case) to frontend types (camelCase)
 */

import type { Product, Category, ProductVariant, ProductUnitType } from "@/types";
import type { ProductWithNormalizedVariants, ProductOption, ProductVariantNormalized } from "@/types";
import type { StorefrontProduct, ProductOption as ApiProductOption, ProductVariant as ApiProductVariant } from "@/lib/api/storefront-products";
import type { StorefrontCategory } from "@/lib/api/storefront-categories";

/**
 * Transform API variant to frontend ProductVariant type
 */
function transformVariant(apiVariant: any): ProductVariant {
  return {
    id: apiVariant.id,
    name: apiVariant.value || apiVariant.name, // Use 'value' for display (e.g., "500g", "1kg")
    displayName: apiVariant.value || apiVariant.name, // Display the variant value
    type: apiVariant.type || 'unit',
    value: apiVariant.value || apiVariant.unit,
    unit: (apiVariant.unit || apiVariant.type || 'goi') as ProductUnitType,
    conversionRate: apiVariant.conversion_rate || 1,
    stock: apiVariant.stock || 0,
    price: apiVariant.price || 0,
    priceModifier: undefined, // Deprecated field
  };
}

/**
 * Transform API product to frontend Product type
 */
export function transformProduct(apiProduct: StorefrontProduct): Product {
  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    description: apiProduct.description || "",
    price: apiProduct.price,
    originalPrice: apiProduct.original_price,
    images: apiProduct.images?.map((img) => img.url) || [],
    categoryId: apiProduct.category_id || "",
    variants: apiProduct.variants?.map(transformVariant),
    stock: apiProduct.stock,
    rating: 4.5, // Default rating (API doesn't have reviews yet)
    reviewCount: 0, // Default (API doesn't have reviews yet)
    sold: apiProduct.sold || 0, // Map from API response
    location: "TP.HCM", // Default location
    badges: [],
    specifications: apiProduct.specifications || {}, // Map from API response
    createdAt: apiProduct.created_at,
    updatedAt: apiProduct.updated_at,
  };
}

/**
 * Transform API category to frontend Category type
 */
export function transformCategory(apiCategory: StorefrontCategory): Category {
  return {
    id: apiCategory.id,
    slug: apiCategory.slug,
    name: apiCategory.name,
    icon: apiCategory.image_url,
    image: apiCategory.image_url,
    parentId: apiCategory.parent_id,
    productCount: apiCategory.product_count || 0,
    children: [],
    order: apiCategory.display_order,
  };
}

/**
 * Smart transform for single product - auto-detects variant system
 * Returns Product or ProductWithNormalizedVariants based on data
 */
export function transformProductAuto(apiProduct: StorefrontProduct): Product | any {
  // Check if product has normalized multi-attribute variants
  if (hasNormalizedVariants(apiProduct)) {
    return transformProductWithNormalizedVariants(apiProduct);
  }
  // Legacy single-attribute variants
  return transformProduct(apiProduct);
}

/**
 * Transform array of API products (smart auto-detection)
 * Returns mixed array of Product | ProductWithNormalizedVariants
 */
export function transformProducts(apiProducts: StorefrontProduct[]): (Product | any)[] {
  return apiProducts.map(transformProductAuto);
}

/**
 * Transform array of API categories
 */
export function transformCategories(apiCategories: StorefrontCategory[]): Category[] {
  return apiCategories.map(transformCategory);
}

/**
 * Transform API product option to frontend ProductOption type
 */
function transformProductOption(apiOption: ApiProductOption): ProductOption {
  return {
    id: apiOption.id,
    name: apiOption.name,
    position: apiOption.position,
    values: apiOption.values.map((v) => ({
      id: v.id,
      value: v.value,
    })),
  };
}

/**
 * Transform API normalized variant to frontend ProductVariantNormalized type
 */
function transformNormalizedVariant(apiVariant: ApiProductVariant): ProductVariantNormalized {
  return {
    id: apiVariant.id,
    sku: apiVariant.sku || undefined,
    price: apiVariant.price,
    originalPrice: apiVariant.original_price,
    stock: apiVariant.stock,
    isActive: true,
    attributes: apiVariant.attributes || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Transform API product to ProductWithNormalizedVariants
 * Use this when product has options (multi-attribute variants)
 */
export function transformProductWithNormalizedVariants(
  apiProduct: StorefrontProduct
): ProductWithNormalizedVariants {
  return {
    id: apiProduct.id,
    slug: apiProduct.slug,
    name: apiProduct.name,
    description: apiProduct.description,
    price: apiProduct.price,
    originalPrice: apiProduct.original_price,
    images: apiProduct.images?.map((img, index) => ({
      id: img.id,
      url: img.url,
      altText: img.alt_text,
      displayOrder: img.display_order || index,
    })) || [],
    categoryId: apiProduct.category_id,
    stock: apiProduct.stock,
    rating: 4.5, // Default rating
    reviewCount: 0, // Default
    sold: apiProduct.sold || 0,
    location: "TP.HCM",
    badges: [],
    specifications: apiProduct.specifications || {},
    isActive: apiProduct.is_active,
    isFeatured: false, // Default
    createdAt: apiProduct.created_at,
    updatedAt: apiProduct.updated_at,
    category: apiProduct.category,
    // Normalized variant fields
    options: apiProduct.options?.map(transformProductOption) || [],
    variants: apiProduct.variants?.map(transformNormalizedVariant) || [],
  };
}

/**
 * Check if product has normalized variants (multi-attribute system)
 */
export function hasNormalizedVariants(apiProduct: StorefrontProduct): boolean {
  return !!(apiProduct.options && apiProduct.options.length > 0);
}
