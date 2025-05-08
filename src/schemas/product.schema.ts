import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

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
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.plugin(mongoosePaginate);
