import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bull';
import { CategoriesModule } from './categories/categories.module';
import { SupabaseService } from './supabase/supabase.service';
import { UserAssets, UserAssetsSchema } from './schemas/user-assets.schema';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CartModule } from './cart/cart.module';
import { TransactionModule } from './transaction/transaction.module';
import { MidtransModule } from './transaction/midtrans/midtrans.module';
import { EmployeeModule } from './employee/employee.module';
import { CmsTransactionModule } from './cms/transaction/transaction.module';
import { DashboardModule } from './cms/dashboard/dashboard.module';
import googleOauthConfig from './config/google-oauth-config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development'],
      cache: true,
      isGlobal: true,
      load: [googleOauthConfig],
    }),
    BullModule.forRootAsync({
      useFactory: () => {
        const redisConfig = process.env.REDIS_URL;
        const redisUrl = redisConfig ? new URL(redisConfig) : null;

        if (redisUrl) {
          return {
            redis: {
              host: redisUrl.hostname,
              port: Number(redisUrl.port),
              password: redisUrl.password,
            },
          };
        }
        if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
          throw new Error(
            'Redis configuration is missing in environment variables.',
          );
        }
        return {
          redis: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
          },
        };
      },
    }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? ''),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: UserAssets.name,
        schema: UserAssetsSchema,
      },
    ]),
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT),
          secure: process.env.MAIL_SECURE === 'true',
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        },
      }),
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    ReviewsModule,
    CartModule,
    TransactionModule,
    MidtransModule,
    EmployeeModule,
    CmsTransactionModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
