import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationParams } from 'src/types/pagination';
import { SortType } from 'src/types/sorttype';

export class ParamsSearchProductDto extends PaginationParams {
  @IsOptional()
  @Type(() => String)
  @IsString()
  sorttype?: SortType;

  @IsOptional()
  @Type(() => String)
  @IsString()
  sortby?: string;

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
}
