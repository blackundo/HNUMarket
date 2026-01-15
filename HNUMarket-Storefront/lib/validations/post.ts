import { z } from 'zod';

/**
 * Post Status Enum
 */
export const postStatusEnum = z.enum(['draft', 'published', 'archived']);

/**
 * Post Validation Schema
 *
 * Validates blog post data with title, content, cover image, and metadata.
 */
export const postSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  excerpt: z.string().max(500).optional(),
  content: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: postStatusEnum.optional(),
});

/**
 * TypeScript Types
 */
export type PostFormData = z.infer<typeof postSchema>;
export type PostStatus = z.infer<typeof postStatusEnum>;
