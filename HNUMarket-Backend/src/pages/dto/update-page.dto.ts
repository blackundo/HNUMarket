import { PartialType } from '@nestjs/mapped-types';
import { CreatePageDto } from './create-page.dto';

/**
 * Update Page DTO
 *
 * Makes all CreatePageDto fields optional for partial updates.
 */
export class UpdatePageDto extends PartialType(CreatePageDto) {}
