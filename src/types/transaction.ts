import { IsDate, IsOptional } from 'class-validator';
import { ReservationStatus } from './enum';
import { Type } from 'class-transformer';
import { PaginationParams } from './pagination';

type UserSummary = {
  _id: string;
  name: string;
};

type TransactionSummary = {
  _id: string;
  orderCode: string | null;
  status: string;
};

type TransactionOrderItem = {
  _id: string;
  transactionId: string;
  serviceStatus: string;
  reservationDate: string;
  user: UserSummary;
  transaction: TransactionSummary;
};

export type AggregatedResult = {
  data: TransactionOrderItem[];
  totalCount: { total: number }[];
};

// detail
export type Product = {
  _id: string;
  name: string;
  price: number;
};

export type Employee = {
  _id: string;
  name: string;
};

export type TransactionItemWithPopulatedRefs = {
  productId: Product;
  employeeId: Employee;
  [key: string]: any;
};

export type TransactionResponse = {
  transactions: TransactionItem[];
  paginator: Paginator;
};

export type TransactionItem = {
  _id: string;
  reservationDate: string;
  note: string;
  transactionId: string;
  serviceStatus: ReservationStatus;
  transaction: TransactionSummary;
  user: UserSummary;
  product: {
    _id: string;
    name: string;
    price: number;
    assetRef?: string;
  };
};

export type Paginator = {
  totalItem: number;
  limit: number;
  currentPage: number;
  pageCount: number;
  pageCounter: number;
  hasPrev: boolean;
  hasNext: boolean;
  prev: number | null;
  next: number | null;
};

export class ScheduleQueryParams extends PaginationParams {
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  reservationDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
}
