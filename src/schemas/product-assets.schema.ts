import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductAssetsDocument = HydratedDocument<ProductAssets>;

@Schema({ timestamps: true })
export class ProductAssets {
  @Prop({ default: null })
  type?: string;

  @Prop({ default: null })
  path!: string;

  @Prop({
    default: null,
  })
  publicUrl!: string;

  @Prop({ type: Types.ObjectId, default: null, index: true, ref: 'Product' })
  productId!: Types.ObjectId;
}

export const ProductAssetsSchema = SchemaFactory.createForClass(ProductAssets);
