import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true })
export class PasswordReset {
  @Prop({ unique: true, index: true })
  token!: string;

  @Prop({ unique: true, index: true })
  email!: string;

  @Prop({ index: true, default: () => new Date(Date.now() + 12 * 60 * 1000) })
  expired_time!: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);
