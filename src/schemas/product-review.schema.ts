import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductReviewDocument = HydratedDocument<ProductReview>;

@Schema({ timestamps: true })
export class ProductReview {
  @Prop({ default: null, maxlength: 2000 })
  review?: string;

  @Prop({ default: 0 })
  rating!: number;

  @Prop({ type: Types.ObjectId, default: null, index: true, ref: 'Product' })
  productId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, default: null, index: true, ref: 'User' })
  userId!: Types.ObjectId;
}

export const ProductReviewSchema = SchemaFactory.createForClass(ProductReview);
