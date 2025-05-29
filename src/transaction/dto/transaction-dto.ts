import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { ReservationStatus } from 'src/types/enum';
import { PaginationParams } from 'src/types/pagination';

export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  GOPAY = 'gopay',
  QRIS = 'qris',
}

export class ChargeDto {
  @IsMongoId()
  @IsNotEmpty()
  transactionId!: Types.ObjectId;

  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @IsArray()
  items!: ChargeItemDto[];

  @IsNumber()
  @IsNotEmpty()
  transactionFee!: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod!: PaymentMethod;

  @IsString()
  @IsOptional()
  bank?: string;
}

class ChargeItemDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: Types.ObjectId;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsNumber()
  @IsNotEmpty()
  estimation!: number;
}

export class UpdateTransactionDto {}

export class CalculateBillDto {
  @IsMongoId()
  @IsNotEmpty()
  @Type(() => Types.ObjectId)
  transactionId!: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  bank?: string;
}

export class CollectBillDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayNotEmpty()
  @Type(() => ItemsDto)
  items!: ItemsDto[];
}

class ItemsDto {
  @IsMongoId()
  @IsNotEmpty()
  productId!: Types.ObjectId;

  @IsString({ each: true })
  @IsOptional()
  note?: string[];

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsNumber()
  @IsNotEmpty()
  price!: number;
}

export class PaymentPaginationParams extends PaginationParams {
  @IsEnum(ReservationStatus)
  @IsString()
  @IsOptional()
  paymentStatus?: ReservationStatus;
}
