import { IsArray, IsUUID } from 'class-validator';

/**
 * Reorder Categories DTO
 *
 * Validates array of category IDs for reordering.
 * Categories must all share the same parent_id.
 */
export class ReorderCategoriesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
