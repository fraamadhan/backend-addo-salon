import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { StyleType } from 'src/types/enum';
import { PaginationParams } from 'src/types/pagination';

export class ParamsSearchProductDto extends PaginationParams {
  @IsOptional()
  @Type(() => String)
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  subCategory?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lowestPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  highestPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @IsString()
  @Type(() => String)
  @IsOptional()
  @IsEnum(StyleType)
  type?: StyleType;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  getAll?: boolean;
}
