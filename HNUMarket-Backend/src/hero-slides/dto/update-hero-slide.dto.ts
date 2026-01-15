import { PartialType } from '@nestjs/mapped-types';
import { CreateHeroSlideDto } from './create-hero-slide.dto';

/**
 * Update Hero Slide DTO
 *
 * All fields are optional for partial updates.
 */
export class UpdateHeroSlideDto extends PartialType(CreateHeroSlideDto) {}
