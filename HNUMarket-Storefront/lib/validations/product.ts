import { z } from 'zod';

/**
 * Vietnamese product unit types
 */
export const PRODUCT_UNITS = [
  'goi',   // Gói - package
  'loc',   // Lốc - bundle
  'thung', // Thùng - carton
  'chai',  // Chai - bottle
  'hop',   // Hộp - box
  'lon',   // Lon - can
  'kg',    // Kilogram
  'g',     // Gram
  'l',     // Liter
  'ml',    // Milliliter
  'cai',   // Cái - piece
  'bo',    // Bộ - set
  'tui',   // Túi - bag
  'vi',    // Vỉ - blister pack
] as const;

export const UNIT_LABELS: Record<typeof PRODUCT_UNITS[number], string> = {
  goi: 'Gói',
  loc: 'Lốc',
  thung: 'Thùng',
  chai: 'Chai',
  hop: 'Hộp',
  lon: 'Lon',
  kg: 'Kg',
  g: 'g',
  l: 'Lít',
  ml: 'ml',
  cai: 'Cái',
  bo: 'Bộ',
  tui: 'Túi',
  vi: 'Vỉ',
};

/**
 * Product Variant Schema with unit system
 */
export const productVariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  displayName: z.string().optional(),
  unit: z.enum([...PRODUCT_UNITS] as [string, ...string[]], {
    message: 'Please select a valid unit type',
  }),
  conversionRate: z.number().int().min(1, 'Conversion rate must be at least 1'),
  price: z.number().min(0, 'Price must be non-negative'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  sku: z.string().optional(),
});

/**
 * Product Option Schema (Normalized)
 */
export const productOptionValueSchema = z.object({
  value: z.string().min(1, 'Option value is required'),
});

export const productOptionSchema = z.object({
  name: z.string().min(1, 'Option name is required'),
  position: z.number().int().min(0),
  values: z.array(productOptionValueSchema).min(1, 'Option values are required'),
});

/**
 * Product Variant Schema (Normalized)
 */
export const productVariantNormalizedSchema = z.object({
  attributeCombination: z.record(z.string(), z.string()),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  price: z.number().min(0, 'Price must be non-negative'),
  originalPrice: z.number().min(0, 'Original price must be non-negative').optional(),
  sku: z.string().optional(),
  imageUrl: z
    .string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.originalPrice === undefined || data.originalPrice === null) return true;
    return data.originalPrice >= data.price;
  },
  {
    message: 'Giá gốc phải lớn hơn hoặc bằng giá bán',
    path: ['originalPrice'],
  }
);

/**
 * Product Image Schema
 */
export const productImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  alt_text: z.string().optional(),
  display_order: z.number().int().min(0).optional(),
});

/**
 * Create Product Schema
 * Note: Uses camelCase to match backend API contract
 */
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  originalPrice: z.number().min(0, 'Original price must be non-negative').optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  sku: z.string().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  variants: z.array(productVariantSchema).optional(),
  options: z.array(productOptionSchema).optional(),
  variantsNormalized: z.array(productVariantNormalizedSchema).optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  slug: z
    .string()
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang')
    .refine((val) => !val || (!val.startsWith('-') && !val.endsWith('-')), {
      message: 'Slug không được bắt đầu hoặc kết thúc bằng dấu gạch ngang',
    })
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    if (data.originalPrice === undefined || data.originalPrice === null) return true;
    return data.originalPrice >= data.price;
  },
  {
    message: 'Giá gốc phải lớn hơn hoặc bằng giá bán',
    path: ['originalPrice'],
  }
);

/**
 * Update Product Schema (all fields optional)
 */
export const updateProductSchema = createProductSchema.partial();

/**
 * Product Query Schema
 */
export const productQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  sortBy: z.enum(['name', 'price', 'created_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * TypeScript Types
 */
export type ProductVariant = z.infer<typeof productVariantSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
