import {
  IsEmail,
  IsMobilePhone,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsMobilePhone('id-ID')
  phoneNumber!: string;

  @IsNumber()
  @IsOptional()
  availability?: number;
}
