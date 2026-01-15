import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class TrashQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['deleted_at', 'expires_at', 'name'])
  sortBy?: string = 'deleted_at';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class BulkTrashDto {
  @IsString({ each: true })
  ids: string[];
}
