import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerification>;

@Schema({ timestamps: true })
export class EmailVerification {
  @Prop({ unique: true, index: true })
  token!: string;

  @Prop({ unique: true, index: true })
  email!: string;

  @Prop({ index: true, default: () => new Date(Date.now() + 60 * 60 * 1000) })
  expired_time!: Date;
}

export const EmailVerificationSchema =
  SchemaFactory.createForClass(EmailVerification);
