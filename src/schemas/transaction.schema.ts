import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod, ReservationStatus } from 'src/types/enum';
import * as mongoosePaginate from 'mongoose-paginate-v2';

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
  paymentMethod?: PaymentMethod | string;

  @Prop({ default: null })
  bank?: string;

  @Prop({ default: 'online' })
  transactionType?: string;

  @Prop({ default: null, maxlength: 100 })
  customerName?: string;

  @Prop({ default: null, maxlength: 100 })
  serviceName?: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
TransactionSchema.plugin(mongoosePaginate);
