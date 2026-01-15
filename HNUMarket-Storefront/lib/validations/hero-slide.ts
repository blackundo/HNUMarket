import { z } from 'zod';

/**
 * Hero Slide validation schemas
 * Using camelCase to match backend DTO
 */

export const createHeroSlideSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  gradient: z.string().optional(),
  link: z.string().min(1, 'Liên kết không được để trống'),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateHeroSlideSchema = createHeroSlideSchema.partial();

export const heroSlideQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateHeroSlideInput = z.input<typeof createHeroSlideSchema>;
export type UpdateHeroSlideInput = z.infer<typeof updateHeroSlideSchema>;
export type HeroSlideQuery = z.infer<typeof heroSlideQuerySchema>;
