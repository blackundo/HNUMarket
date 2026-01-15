import { z } from 'zod';

/**
 * Page Status Enum
 */
export const pageStatusEnum = z.enum(['draft', 'published', 'archived']);

/**
 * Page Validation Schema
 *
 * Validates static page data with title, optional slug, and HTML content.
 */
export const pageSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  slug: z.string().max(200).optional(),
  content: z.string().optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
  status: pageStatusEnum.optional(),
});

/**
 * TypeScript Types
 */
export type PageFormData = z.infer<typeof pageSchema>;
export type PageStatus = z.infer<typeof pageStatusEnum>;
