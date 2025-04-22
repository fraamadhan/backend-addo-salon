import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import {
  EmailVerification,
  EmailVerificationSchema,
} from 'src/schemas/email-verification.schema';
import { BullModule } from '@nestjs/bull';
import { EmailVerificationProcessor } from './processor/email-verification.processor';
import {
  PasswordReset,
  PasswordResetSchema,
} from 'src/schemas/password-reset.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: EmailVerification.name,
        schema: EmailVerificationSchema,
      },
      {
        name: PasswordReset.name,
        schema: PasswordResetSchema,
      },
    ]),
    BullModule.registerQueue({
      name: 'email-verification',
    }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        global: true,
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailVerificationProcessor, JwtStrategy],
})
export class AuthModule {}
