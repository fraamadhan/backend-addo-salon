import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({ default: null, index: true, maxlength: 50 })
  name!: string;

  @Prop({ default: null, unique: true, maxlength: 50 })
  slug!: string;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Category', index: true })
  parentId?: Types.ObjectId;

  @Prop({ default: 0 })
  code!: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
