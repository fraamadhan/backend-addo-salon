import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  HttpStatus,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ForgotPasswordDTO,
  LoginDTO,
  RegisterDTO,
  ResetPasswordDTO,
} from './dto/auth.dto';
import { responseError, responseSuccess } from 'src/utils/response';
import Logger from 'src/logger';
import { EmailVerificationType } from 'src/types/general';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly logger = new Logger();

  @Post('/register')
  async register(@Body() body: RegisterDTO) {
    try {
      const data = await this.authService.create(body);

      this.logger.log(
        `[AuthController - register] User ${data.name} with email ${data.email} registered successfully`,
      );

      const token = await this.authService.generateVerificationToken(
        body.email,
        EmailVerificationType.REGISTER,
      );

      await this.authService.addEmailVerificationJob(body.email, token);

      return responseSuccess(
        HttpStatus.CREATED,
        'Tolong cek email Anda untuk melakukan verifikasi email',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[AuthController - register] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Post('/login')
  async login(@Body() body: LoginDTO) {
    try {
      const data = await this.authService.login(body);

      return responseSuccess(
        HttpStatus.OK,
        'Anda berhasil masuk ke aplikasi',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[AuthController - login] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Get('/email-verification/:token')
  async emailVerification(@Param('token') token: string) {
    try {
      await this.authService.verifyEmail(token);

      return responseSuccess(HttpStatus.OK, 'Email berhasil diverifikasi');
    } catch (error: any) {
      this.logger.errorString(error as string);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
    // return this.authService.findOne(+id);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    try {
      await this.authService.forgotPassword(body.email);

      const token = await this.authService.generateVerificationToken(
        body.email,
        EmailVerificationType.FORGOT_PASSWORD,
      );
      await this.authService.addEmailVerificationForgotPasswordJob(
        body.email,
        token,
      );

      this.logger.log(
        `[AuthController - forgotPassword] Password reset link sent to ${body.email}`,
      );
      return responseSuccess(
        HttpStatus.OK,
        'Tolong cek email Anda untuk atur ulang kata sandi',
      );
    } catch (error: any) {
      this.logger.errorString(error as string);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Patch('/reset-password/:token')
  async resetPassword(
    @Param('token') token: string,
    @Body() body: ResetPasswordDTO,
  ) {
    try {
      await this.authService.resetPassword(
        token,
        body.password,
        body.confirmPassword,
      );
      this.logger.log(
        `[AuthController - resetPassword] Password reset successfully`,
      );
      return responseSuccess(HttpStatus.OK, 'Password berhasil diubah');
    } catch (error: any) {
      this.logger.errorString(error as string);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  // @Delete('logout')
}
