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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development'],
      cache: true,
      isGlobal: true,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? '', {
      autoIndex: false,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService, SupabaseService],
})
export class AppModule {}
