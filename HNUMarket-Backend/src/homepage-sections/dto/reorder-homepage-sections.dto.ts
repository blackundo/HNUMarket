import { IsArray, IsUUID } from 'class-validator';

/**
 * Reorder Homepage Sections DTO
 *
 * Accepts an ordered array of section IDs to update display_order.
 * The position in the array determines the new display_order value.
 *
 * @example
 * ```json
 * {
 *   "ids": [
 *     "550e8400-e29b-41d4-a716-446655440001",
 *     "550e8400-e29b-41d4-a716-446655440002",
 *     "550e8400-e29b-41d4-a716-446655440003"
 *   ]
 * }
 * ```
 */
export class ReorderHomepageSectionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
