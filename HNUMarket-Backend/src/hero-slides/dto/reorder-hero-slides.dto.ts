import { IsArray, IsUUID } from 'class-validator';

/**
 * Reorder Hero Slides DTO
 *
 * Validates array of hero slide IDs for reordering.
 */
export class ReorderHeroSlidesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
