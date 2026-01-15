import { IsString, IsNumber, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0)
  fee: number;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateLocationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fee?: number;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
