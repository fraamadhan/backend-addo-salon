import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import { UserAssets, UserAssetsSchema } from 'src/schemas/user-assets.schema';
import { SupabaseService } from 'src/supabase/supabase.service';

@Module({
  imports: [
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
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtService, SupabaseService],
})
export class UsersModule {}
