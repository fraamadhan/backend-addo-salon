import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

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

  @IsArray()
  @Type(() => Array)
  @IsNotEmpty()
  @IsMongoId({ each: true })
  categoryIds!: Types.ObjectId[];

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  @Min(0)
  price!: number;
}
