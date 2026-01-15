import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';

/**
 * Update Category DTO
 *
 * All fields are optional for partial updates.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

