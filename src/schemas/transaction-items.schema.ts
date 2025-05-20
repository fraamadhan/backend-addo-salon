import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReservationStatus } from 'src/types/enum';

export type TransactionItemsDocument = HydratedDocument<TransactionItems>;

@Schema({ timestamps: true })
export class TransactionItems {
  @Prop({ default: null })
  reservationDate!: Date;

  @Prop({ default: 0 })
  price!: number;

  @Prop({ default: null, index: true, type: Types.ObjectId, ref: 'Employee' })
  employeeId!: Types.ObjectId;

  @Prop({ default: null, index: true, type: Types.ObjectId, ref: 'Product' })
  productId!: Types.ObjectId;

  @Prop({ default: null, maxlength: 200 })
  note?: string;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Transaction',
    index: true,
  })
  transactionId!: Types.ObjectId;

  @Prop({ default: ReservationStatus.CART })
  serviceStatus!: ReservationStatus;

  @Prop({ default: false })
  isReviewed!: boolean;
}

export const TransactionItemsSchema =
  SchemaFactory.createForClass(TransactionItems);
