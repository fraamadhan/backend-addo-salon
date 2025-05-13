import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { PaginationParams } from 'src/types/pagination';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(210)
  review!: string;

  @IsNumber()
  @IsNotEmpty()
  rating!: number;

  @IsMongoId()
  @IsNotEmpty()
  userId!: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  productId!: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  transactionId!: Types.ObjectId;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

export class ParamsReviewDto extends PaginationParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @IsMongoId()
  @IsNotEmpty()
  @IsOptional()
  userId!: Types.ObjectId;
}
