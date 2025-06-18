import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RoleType } from 'src/types/role';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, default: null, maxlength: 255 })
  name!: string;

  @Prop({
    required: true,
    default: null,
    maxlength: 255,
    unique: true,
  })
  email!: string;

  @Prop({
    default: null,
    minlength: 4,
  })
  password?: string;

  @Prop({
    default: null,
    maxlength: 8,
  })
  gender?: string;

  @Prop({
    default: null,
    maxlength: 14,
  })
  phone_number?: string;

  @Prop({
    default: null,
    maxlength: 255,
  })
  address?: string;

  @Prop({
    default: null,
    maxlength: 11,
  })
  birth_date!: Date;

  @Prop({
    default: RoleType.USER,
    maxlength: 10,
  })
  role!: string;

  @Prop({
    default: null,
    maxlength: 255,
  })
  google_id?: string;

  @Prop({
    default: null,
    maxlength: 20,
  })
  provider?: string;

  @Prop({
    default: false,
    required: true,
  })
  is_verified!: boolean;

  @Prop({
    default: null,
  })
  email_verified_at?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(mongoosePaginate);
