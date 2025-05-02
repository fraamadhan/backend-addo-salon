import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { LoginDTO, RegisterDTO } from './dto/auth.dto';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { uuidv7 } from 'uuidv7';
import {
  EmailVerification,
  EmailVerificationDocument,
} from 'src/schemas/email-verification.schema';
import { MailerService } from '@nestjs-modules/mailer';
import Logger from 'src/logger';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailVerificationType } from 'src/types/general';
import {
  PasswordReset,
  PasswordResetDocument,
} from 'src/schemas/password-reset.schema';
import { mailTemplate } from 'src/utils/mail-template';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EmailVerification.name)
    private emailVerifModel: Model<EmailVerificationDocument>,
    @InjectModel(PasswordReset.name)
    private passwordResetModel: Model<PasswordResetDocument>,
    @InjectQueue('email-verification') private readonly emailQueue: Queue,
    private mailerService: MailerService,
    private jwtService: JwtService,
  ) {}

  private logger = new Logger();

  async create(body: RegisterDTO) {
    //check if user already exists
    const existingUser = await this.userModel.findOne({
      email: body.email,
    });

    if (existingUser) {
      throw new HttpException('Email sudah digunakan', HttpStatus.BAD_REQUEST);
    }

    //hash password
    const { password } = body;
    const hashedPassword = await bcrypt.hash(password, 10);
    body.password = hashedPassword;

    //create user
    const data = await this.userModel.create(body);

    return data;
  }

  async login(body: LoginDTO) {
    const { email, password } = body;

    //check if user exists
    const existingUser = await this.userModel.findOne({ email }).lean().exec();
    if (!existingUser) {
      throw new HttpException(
        'Pengguna tidak ditemukan',
        HttpStatus.UNAUTHORIZED,
      );
    }

    //check if user is verified
    if (!existingUser.is_verified) {
      const token = await this.generateVerificationToken(
        existingUser.email,
        EmailVerificationType.REGISTER,
      );

      await this.addEmailVerificationJob(existingUser.email, token);

      throw new HttpException(
        'Pengguna belum terverifikasi. Cek email Anda untuk verifikasi email.',
        HttpStatus.BAD_REQUEST,
      );
    }

    //check if password is correct
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      throw new HttpException(
        'Email atau kata sandi salah',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { password: _, ...user } = existingUser;

    const payload = user;

    user['access_token'] = await this.jwtService.signAsync(payload);

    return user;
  }

  async verifyEmail(token: string) {
    if (!token || token.length === 0) {
      throw new HttpException('Token tidak ditemukan', HttpStatus.BAD_REQUEST);
    }

    const existingToken = await this.getVerificationTokenByToken(
      token,
      EmailVerificationType.REGISTER,
    );

    if (!existingToken) {
      throw new HttpException('Token tidak ditemukan', HttpStatus.BAD_REQUEST);
    }

    const isExpired = new Date(existingToken.expired_time) < new Date();

    if (isExpired) {
      throw new HttpException(
        'Token sudah kedaluwarsa. Tolong kirim verifikasi email dengan cara login',
        HttpStatus.GONE,
      );
    }

    const existingUser = await this.userModel.findOne({
      email: existingToken.email,
    });

    if (!existingUser) {
      throw new HttpException(
        'Pengguna tidak ditemukan',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userModel.updateOne(
      {
        _id: existingUser.id,
      },
      {
        is_verified: true,
        email_verified_at: new Date(Date.now()),
      },
    );

    await this.emailVerifModel.deleteOne({
      _id: existingToken.id,
    });
  }

  async forgotPassword(email: string) {
    const existingUser = await this.userModel.findOne({ email });
    if (!existingUser) {
      throw new HttpException(
        'Pengguna tidak ditemukan',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!existingUser.is_verified) {
      throw new HttpException(
        'Pengguna belum terverifikasi. Cek email Anda untuk verifikasi email',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingToken = await this.passwordResetModel.findOne({
      email,
    });

    if (existingToken) {
      const isExpired = new Date(existingToken.expired_time) < new Date();

      if (isExpired) {
        await this.passwordResetModel.deleteOne({
          _id: existingToken.id,
        });
      } else {
        throw new HttpException(
          'Tolong cek email Anda untuk mengatur ulang kata sandi',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ) {
    if (!token || token.length === 0) {
      throw new HttpException('Token tidak ditemukan', HttpStatus.BAD_REQUEST);
    }

    const existingToken = await this.getVerificationTokenByToken(
      token,
      EmailVerificationType.FORGOT_PASSWORD,
    );

    if (!existingToken) {
      throw new HttpException('Token tidak ditemukan', HttpStatus.BAD_REQUEST);
    }

    const isExpired = new Date(existingToken.expired_time) < new Date();

    if (isExpired) {
      throw new HttpException(
        'Token sudah kedaluwarsa. Tolong kirim verifikasi email dengan cara login',
        HttpStatus.GONE,
      );
    }

    if (password !== confirmPassword) {
      throw new HttpException('Password tidak cocok', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.userModel.updateOne(
      {
        email: existingToken.email,
      },
      {
        password: hashedPassword,
      },
    );

    await this.passwordResetModel.deleteOne({
      _id: existingToken.id,
    });
  }

  async generateVerificationToken(email: string, type: EmailVerificationType) {
    try {
      const token = uuidv7();

      switch (type) {
        case EmailVerificationType.REGISTER: {
          const existingToken = await this.emailVerifModel.findOne({
            email,
          });

          if (existingToken) {
            existingToken.token = token;
            await existingToken.save();
          } else {
            await this.emailVerifModel.create({
              email,
              token,
            });
          }
          break;
        }
        case EmailVerificationType.FORGOT_PASSWORD: {
          const existingToken = await this.passwordResetModel.findOne({
            email,
          });

          if (existingToken) {
            existingToken.token = token;
            await existingToken.save();
          } else {
            await this.passwordResetModel.create({
              email,
              token,
            });
          }
          break;
        }
        default:
          throw new HttpException(
            'Tipe yang dimasukkan salah',
            HttpStatus.BAD_REQUEST,
          );
      }

      return token;
    } catch (error) {
      this.logger.errorString(error as string);
      throw new HttpException(
        'Error generating token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getVerificationTokenByEmail(
    email: string,
    type: EmailVerificationType,
  ) {
    let token: string;
    switch (type) {
      case EmailVerificationType.REGISTER: {
        const data = await this.emailVerifModel.findOne({
          email,
        });
        if (!data) {
          throw new HttpException(
            'Token tidak ditemukan',
            HttpStatus.NOT_FOUND,
          );
        }
        token = data.token;
        break;
      }
      case EmailVerificationType.FORGOT_PASSWORD: {
        const data = await this.passwordResetModel.findOne({
          email,
        });
        if (!data) {
          throw new HttpException(
            'Token tidak ditemukan',
            HttpStatus.NOT_FOUND,
          );
        }
        token = data.token;
        break;
      }
      default:
        throw new HttpException(
          'Tipe yang dimasukkan salah',
          HttpStatus.BAD_REQUEST,
        );
    }
    if (!token) {
      throw new HttpException('Token tidak ditemukan', HttpStatus.NOT_FOUND);
    }

    return token;
  }

  async getVerificationTokenByToken(
    token: string,
    type: EmailVerificationType,
  ) {
    switch (type) {
      case EmailVerificationType.REGISTER: {
        const data = await this.emailVerifModel.findOne({
          token,
        });
        if (!data) {
          throw new HttpException(
            'Token tidak ditemukan',
            HttpStatus.NOT_FOUND,
          );
        }
        return data;
      }
      case EmailVerificationType.FORGOT_PASSWORD: {
        const data = await this.passwordResetModel.findOne({
          token,
        });
        if (!data) {
          throw new HttpException(
            'Token tidak ditemukan',
            HttpStatus.NOT_FOUND,
          );
        }
        return data;
      }
      default:
        throw new HttpException(
          'Tipe yang dimasukkan salah',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  async addEmailVerificationJob(email: string, token: string) {
    await this.emailQueue.add('register', { email, token });
  }

  async addEmailVerificationForgotPasswordJob(email: string, token: string) {
    await this.emailQueue.add('forgot-password', { email, token });
  }
  async sendEmailVerificationForgotPassword(email: string, token: string) {
    const url = `${process.env.FE_URL}/auth/forgot-password/${token}`;
    const subject = 'Reset Password';
    const templateBody = mailTemplate(
      EmailVerificationType.FORGOT_PASSWORD,
      url,
    );

    await this.mailerService.sendMail({
      to: email,
      from: 'Addo Salon <raeljarr@gmail.com>',
      subject,
      html: templateBody,
    });
  }

  async sendEmailVerification(email: string, token: string) {
    const url = `${process.env.FE_URL}/auth/verify-email/${token}`;
    const subject = 'Email Verification';
    const templateBody = mailTemplate(EmailVerificationType.REGISTER, url);

    await this.mailerService.sendMail({
      to: email,
      from: 'Addo Salon <raeljarr@gmail.com>',
      subject,
      html: templateBody,
    });
  }
}
