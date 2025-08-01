import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateCartDto {
  @IsMongoId()
  @IsString()
  @IsNotEmpty()
  productId!: Types.ObjectId;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsNumber()
  @IsNotEmpty()
  estimation!: number;
}

export class UpdateCartDto extends PartialType(CreateCartDto) {}

export class UpdateCheckoutCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => CartItem)
  items!: CartItem[];
}

export class CartItem {
  @IsNotEmpty()
  @IsMongoId()
  cartId!: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  productId!: Types.ObjectId;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsNumber()
  @IsNotEmpty()
  estimation!: number;

  @IsString()
  @IsOptional()
  note?: string;
}
