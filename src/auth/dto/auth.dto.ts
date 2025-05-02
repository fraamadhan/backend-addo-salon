import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password!: string;
}

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(12)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password!: string;
}

export class ForgotPasswordDTO {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class ResetPasswordDTO {
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(12)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(12)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'password too weak',
  })
  confirmPassword!: string;
}
