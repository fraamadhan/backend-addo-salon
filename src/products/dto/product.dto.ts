import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { StyleType } from 'src/types/enum';

export class ProductDto {
  @IsString()
  @Type(() => String)
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Type(() => String)
  @MaxLength(1500)
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  estimation!: number;

  @IsString()
  @Type(() => String)
  @IsNotEmpty()
  categoryIds!: string;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  @Min(0)
  price!: number;

  @IsString()
  @Type(() => String)
  @IsNotEmpty()
  @IsEnum(StyleType)
  type!: StyleType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ratingCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  ratingAverage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  orderedCount?: number;

  @IsOptional()
  file!: any;
}

export class UpdateProductDto extends PartialType(ProductDto) {}
