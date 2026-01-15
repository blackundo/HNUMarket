import { PartialType } from '@nestjs/mapped-types';
import { CreateHomepageSectionDto } from './create-homepage-section.dto';

/**
 * Update Homepage Section DTO
 *
 * Partial version of CreateHomepageSectionDto for updates.
 * All fields are optional to support partial updates.
 *
 * @example
 * ```json
 * {
 *   "isActive": false,
 *   "config": {
 *     "layout": {
 *       "product_limit": 12
 *     }
 *   }
 * }
 * ```
 */
export class UpdateHomepageSectionDto extends PartialType(
  CreateHomepageSectionDto,
) {}
