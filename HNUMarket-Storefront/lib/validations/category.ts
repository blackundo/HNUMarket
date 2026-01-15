import { z } from 'zod';

/**
 * Create Category Schema
 */
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục là bắt buộc').max(255),
  slug: z.string().min(1, 'Slug là bắt buộc').max(255).regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
  description: z.string().optional(),
  image_url: z.string().url('URL hình ảnh không hợp lệ').optional().or(z.literal('')),
  parent_id: z.string().uuid('ID danh mục cha không hợp lệ').nullable().optional(),
  display_order: z.number().int().min(0, 'Thứ tự hiển thị phải >= 0'),
  is_active: z.boolean(),
});

/**
 * Update Category Schema (all fields optional)
 */
export const updateCategorySchema = createCategorySchema.partial();

/**
 * Category Query Schema
 */
export const categoryQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
  sort_by: z.enum(['name', 'display_order', 'created_at']).default('display_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * TypeScript Types
 */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;

