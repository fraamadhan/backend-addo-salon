import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserAssetsDocument = HydratedDocument<UserAssets>;

@Schema({ timestamps: true })
export class UserAssets {
  @Prop({ default: null })
  type?: string;

  @Prop({
    default: null,
  })
  path!: string;

  @Prop({ type: Types.ObjectId, default: null, index: true, ref: 'User' })
  userId!: Types.ObjectId;
}

export const UserAssetsSchema = SchemaFactory.createForClass(UserAssets);
