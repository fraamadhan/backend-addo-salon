import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { StyleType } from 'src/types/enum';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, default: 0 })
  estimation!: number;

  @Prop({ required: true, maxlength: 255 })
  name!: string;

  @Prop({ required: true, maxlength: 1500 })
  description!: string;

  @Prop({ type: [Types.ObjectId], default: null, index: true, ref: 'Category' })
  categoryIds!: Types.ObjectId[];

  @Prop({ default: 0 })
  price!: number;

  @Prop({ default: 0 })
  ratingCount!: number;

  @Prop({ default: 0 })
  ratingAverage!: number;

  @Prop({ default: 0 })
  ratingSum?: number;

  @Prop({ enum: StyleType, required: true })
  type!: StyleType;

  @Prop({ default: 0 })
  orderedCount?: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.plugin(mongoosePaginate);
