import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true })
export class PasswordReset {
  @Prop({ unique: true, index: true })
  token!: string;

  @Prop({ unique: true, index: true })
  email!: string;

  @Prop({ index: true, default: new Date().getTime() + 3600 * 200 })
  expired_time!: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
