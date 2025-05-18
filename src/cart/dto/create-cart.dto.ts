import { IsDate, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCartDto {
  @IsMongoId()
  @IsString()
  @IsNotEmpty()
  productId!: Types.ObjectId;

  @IsDate()
  @IsNotEmpty()
  reservationDate!: Date;
}
