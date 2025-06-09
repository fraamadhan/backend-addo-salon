import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { RoleType } from 'src/types/role';

const gender = ['female', 'male'] as const;

@ValidatorConstraint({ name: 'PasswordMatch', async: false })
class PasswordMatchConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const object = args.object as {
      password?: string;
      confirmPassword?: string;
    };
    if (!object.password && !object.confirmPassword) {
      return true;
    }

    return object.password === object.confirmPassword;
  }

  defaultMessage(args?: ValidationArguments): string {
    return `Password and Confirm Password must match`;
  }
}

export class UserCreateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password?: string;

  @IsString()
  @IsOptional()
  @IsIn(gender)
  @MaxLength(8)
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(14)
  phone_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @IsString()
  @IsEnum(RoleType)
  @IsOptional()
  role?: RoleType;

  @IsString()
  @IsOptional()
  is_verified?: string | boolean;

  @IsDate()
  @IsOptional()
  email_verified_at?: Date;

  @IsOptional()
  file?: any;
}

export class UserUpdateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  oldPassword?: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password?: string;

  @IsString()
  @IsOptional()
  @MinLength(4)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  confirmPassword?: string;

  @Validate(PasswordMatchConstraint)
  passwordMatch?: string;

  @IsString()
  @IsOptional()
  @IsIn(gender)
  @MaxLength(8)
  gender?: string;

  @IsString()
  @IsOptional()
  @MaxLength(14)
  phone_number?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsDateString()
  @IsOptional()
  birth_date?: string;

  @IsString()
  @IsEnum(RoleType)
  @IsOptional()
  role?: RoleType;

  @IsString()
  @IsOptional()
  is_verified?: string | boolean;

  @IsDate()
  @IsOptional()
  email_verified_at?: Date;

  @IsOptional()
  file?: any;
}
