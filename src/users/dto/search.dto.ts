import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { PaginationParams } from 'src/types/pagination';
import { SortType } from 'src/types/sorttype';

export class ParamsSearchUserDto extends PaginationParams {
  @IsOptional()
  @Type(() => String)
  @IsString()
  sortby?: string;

  @IsOptional()
  @Type(() => String)
  @IsString()
  sorttype?: SortType;
}
