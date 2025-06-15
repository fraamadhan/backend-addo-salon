import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type EmployeeDocument = HydratedDocument<Employee>;

@Schema({ timestamps: true })
export class Employee {
  @Prop({ default: null })
  name!: string;

  @Prop({ default: null })
  email!: string;

  @Prop({ default: null })
  phoneNumber!: string;

  @Prop({ default: 0 })
  availability!: number;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);
EmployeeSchema.plugin(mongoosePaginate);
