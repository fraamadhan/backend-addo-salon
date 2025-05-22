import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SortType } from './sorttype';

export class PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @Type(() => String)
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  slug?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  sorttype?: SortType;

  @IsOptional()
  @Type(() => String)
  @IsString()
  sortby?: string;

  //filter by category
  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsMongoId()
  parent_id?: string; //kategori level 1

  @IsOptional()
  @Type(() => String)
  @IsString()
  @IsMongoId()
  child_id?: string; //kategori level 2
}
