import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Matches,
  ValidateIf,
} from 'class-validator';

/**
 * Create Category DTO
 *
 * Validates data for creating a new category.
 */
export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => o.parentId !== null)
  parentId?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  displayOrder?: number = 0;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

