import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';
import { ReservationStatus } from 'src/types/enum';
import { PaginationParams } from 'src/types/pagination';

export class CmsUpdateTransactionDto {
  @IsString()
  @IsOptional()
  orderCode?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsMongoId()
  @IsOptional()
  employeeId?: Types.ObjectId;

  @IsString()
  @IsOptional()
  transactionType?: string;
}

export class UpdateScheduleDto {
  @IsMongoId()
  @IsNotEmpty()
  userId!: Types.ObjectId;

  @IsMongoId()
  @IsNotEmpty()
  transactionItemId!: Types.ObjectId;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsNumber()
  @IsNotEmpty()
  estimation!: number;
}

export class TransactionQueryParams extends PaginationParams {
  @IsEnum(ReservationStatus)
  @IsOptional()
  orderStatus?: ReservationStatus;

  @IsDate()
  @IsOptional()
  reservationDate?: Date;

  @IsMongoId()
  @IsOptional()
  productId?: Types.ObjectId;
}

export class CmsCreateTransactionDto {
  @IsNumber()
  @IsNotEmpty()
  total_price!: number;

  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status!: ReservationStatus;

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  bank?: string;

  @IsString()
  @IsNotEmpty()
  transactionType!: string;

  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsNotEmpty()
  serviceName!: string;

  @IsNumber()
  @IsNotEmpty()
  servicePrice!: number;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;
}
