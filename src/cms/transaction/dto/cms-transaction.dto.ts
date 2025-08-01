import { Type } from 'class-transformer';
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
  customerName?: string;

  @IsMongoId()
  @IsOptional()
  employeeId?: Types.ObjectId;

  @IsMongoId()
  @IsOptional()
  transactionId?: Types.ObjectId;
}

export class UpdateScheduleDto {
  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsNumber()
  @IsNotEmpty()
  estimation!: number;
}

export class GetChooseEmployee {
  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsDate()
  @IsOptional()
  reservationDate!: Date;

  @IsNumber()
  @IsOptional()
  estimation!: number;
}

export class TransactionQueryParams extends PaginationParams {
  @IsEnum(ReservationStatus)
  @IsOptional()
  orderStatus?: ReservationStatus;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  reservationDate?: string;

  @IsMongoId()
  @IsOptional()
  productId?: Types.ObjectId;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: string;
}

export class CmsCreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @IsString()
  @IsOptional()
  orderCode?: string;

  @IsString()
  @IsNotEmpty()
  employeeId!: string;

  @IsString()
  @IsNotEmpty()
  transactionType!: string;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;

  @IsEnum(ReservationStatus)
  @IsNotEmpty()
  status!: ReservationStatus;

  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  paymentMethod!: string;

  @IsString()
  @IsOptional()
  bank?: string;
}
