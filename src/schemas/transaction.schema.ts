import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod, ReservationStatus } from 'src/types/enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ default: null, type: Types.ObjectId, index: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ default: 0 })
  total_price!: number;

  @Prop({ default: ReservationStatus.CART })
  status!: ReservationStatus;

  @Prop({ default: null })
  orderCode?: string;

  @Prop({ enum: PaymentMethod, default: null })
  paymentMethod?: PaymentMethod;

  @Prop({ default: null })
  bank?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
