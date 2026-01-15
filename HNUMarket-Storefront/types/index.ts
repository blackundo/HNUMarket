// Product Types

/**
 * Vietnamese product unit types
 * Matches backend ProductUnit enum
 * @deprecated Use normalized variant system instead
 */
export type ProductUnitType =
  | 'goi'   // Gói - package
  | 'loc'   // Lốc - bundle (4-6 items)
  | 'thung' // Thùng - carton
  | 'chai'  // Chai - bottle
  | 'hop'   // Hộp - box
  | 'lon'   // Lon - can
  | 'kg'    // Kilogram
  | 'g'     // Gram
  | 'l'     // Liter
  | 'ml'    // Milliliter
  | 'cai'   // Cái - piece
  | 'bo'    // Bộ - set
  | 'tui'   // Túi - bag
  | 'vi';   // Vỉ - blister pack

/**
 * Product variant with unit system (Legacy)
 * @deprecated Use ProductVariantNormalized from './product-variants' instead
 */
export interface ProductVariant {
  id: string;
  name: string;           // "Gói 1", "Lốc 6", "Thùng 24"
  displayName?: string;   // "1 Gói", "Lốc 6 gói"
  type: string;           // 'unit', 'size', 'color', etc. (kept for backward compat)
  value: string;          // Legacy field
  unit: ProductUnitType;  // Vietnamese unit type
  conversionRate: number; // Conversion to base unit (goi=1, loc 6=6)
  stock: number;
  price: number;          // Absolute price in KRW
  priceModifier?: number; // @deprecated Legacy field
}

export interface Product {
  id: string;
  slug: string;
  name: string; // Vietnamese
  description: string; // Vietnamese
  price: number;
  originalPrice?: number; // For discount display
  images: string[]; // Relative paths: /images/products/...
  categoryId: string;
  variants?: ProductVariant[];
  stock: number;
  rating: number; // 0-5
  reviewCount: number;
  sold: number; // Number of items sold
  location: string; // "TP.HCM", "Hà Nội"
  badges?: ProductBadge[];
  specifications?: Record<string, string>; // Key-value specs
  createdAt: string;
  updatedAt: string;
}

export type ProductBadge = 'flash-sale' | 'freeship' | 'authentic' | 'best-seller' | 'new';

export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  badges?: ProductBadge[];
  sortBy?: 'popularity' | 'price-asc' | 'price-desc' | 'newest' | 'best-rating';
  page?: number;
  limit?: number;
}

// Category Types
export interface Category {
  id: string;
  slug: string;
  name: string; // Vietnamese
  icon?: string; // Path to icon image
  image?: string; // Category banner image
  parentId?: string;
  productCount: number;
  children?: Category[];
  order: number;
}

// Blog Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string; // Vietnamese
  excerpt: string; // Vietnamese - short description for listing
  content: string; // Vietnamese - full content
  author: string; // Vietnamese author name
  date: string; // ISO format: "2025-12-19T10:00:00Z"
  featuredImage: string; // Full-size image for detail page
  thumbnail: string; // Smaller image for listing page
  createdAt: string;
  updatedAt: string;
}

// Cart Types
export interface CartItem {
  productId: string;
  variantId?: string;
  attributes?: Record<string, string>; // Multi-attribute variant selection
  quantity: number;
  addedAt: string;
}

export interface CartItemWithDetails extends CartItem {
  product: Product;
  variant?: ProductVariant;
}

export interface CartSummary {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}

// UI Types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'messenger' | 'zalo';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'full';

export type BadgeVariant = 'sale' | 'new' | 'freeship' | 'authentic' | 'best-seller' | 'cod' | 'stock-low';

// Filter Types
export interface PriceRange {
  min: number;
  max: number;
  label: string;
}

export interface FilterOption {
  id: string;
  label: string;
  value: string | number | boolean;
  count?: number;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  type: 'checkbox' | 'radio' | 'range';
}

// Sort Types
export interface SortOption {
  value: ProductFilters['sortBy'];
  label: string;
}

// Pagination Types
export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Response Types
export interface ProductResponse {
  products: Product[];
  pagination: PaginationData;
}

// Auth Types
export type { User, AuthContextValue } from './auth';

// AI Image Generation
export * from './ai-image-generation';

// Product Variants (Normalized Multi-Attribute)
export * from './product-variants';

// Orders
export * from './orders';
