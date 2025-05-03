import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ReservationStatus } from 'src/types/status';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ default: null, type: Types.ObjectId, index: true, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ default: 0 })
  total_price!: number;

  @Prop({ default: null, maxlength: 1500 })
  note?: string;

  @Prop({ default: ReservationStatus.CART })
  status!: ReservationStatus;

  @Prop({ default: null })
  paymentType?: string;

  @Prop({ default: null })
  bank?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
