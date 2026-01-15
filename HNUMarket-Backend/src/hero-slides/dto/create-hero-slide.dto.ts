import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
} from 'class-validator';

/**
 * Create Hero Slide DTO
 *
 * Validates data for creating a new hero slide.
 */
export class CreateHeroSlideDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  gradient?: string;

  @IsString()
  link: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number = 0;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
