import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ default: null })
  reservationDate!: Date;

  @Prop({ default: 0 })
  price!: number;

  @Prop({ default: null, index: true, type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ default: null, index: true, type: Types.ObjectId, ref: 'Product' })
  productId!: Types.ObjectId;

  @Prop({ default: false })
  isCheckoutLocked!: boolean;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
