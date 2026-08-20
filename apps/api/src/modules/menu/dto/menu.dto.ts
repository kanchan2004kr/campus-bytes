import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpsertCategoryDto {
  @IsString() @MinLength(1) @MaxLength(60)
  name!: string;

  @IsOptional() @IsNumber()
  sortOrder?: number;
}

export class UpsertItemDto {
  @IsString()
  categoryId!: string;

  @IsString() @MinLength(1) @MaxLength(80)
  name!: string;

  @IsOptional() @IsString() @MaxLength(280)
  description?: string;

  @Type(() => Number) @IsNumber() @Min(1)
  price!: number;

  @IsBoolean()
  isVeg!: boolean;

  @IsOptional() @IsUrl()
  imageUrl?: string | null;
}

export class AvailabilityDto {
  @IsBoolean()
  isAvailable!: boolean;
}
