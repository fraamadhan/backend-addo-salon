import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { prefix_public_user_file } from './file-path';
import { UserAssets, UserAssetsDocument } from './schemas/user-assets.schema';
import { SupabaseService } from './supabase/supabase.service';
import Logger from './logger';

class CreateUserDto {
  readonly name!: string;
  readonly age!: number | undefined;
  readonly sex: string | undefined | null;
}

class UpdateUserDto {
  readonly name?: string;
  readonly age?: number;
  readonly sex?: string;
}

@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UserAssets.name)
    private userAssetModel: Model<UserAssetsDocument>,
    private supabaseService: SupabaseService,
  ) {}

  private readonly logger = new Logger();

  findAll() {
    return 'Hello world';
  }

  async create(body: CreateUserDto, file: Express.Multer.File): Promise<User> {
    const before = Date.now();

    const user = await this.userModel.create(body);

    if (file) {
      const file_path = `${prefix_public_user_file}/${Date.now()}_${file.originalname}`;
      const uploadToSupabase = await this.supabaseService.uploadImage(
        file_path,
        file,
      );

      if (!uploadToSupabase?.path) {
        throw new InternalServerErrorException(
          'Failed to upload image to Supabase',
        );
      }

      await this.userAssetModel.create({
        type: file.mimetype,
        path: uploadToSupabase?.path,
        publicUrl: uploadToSupabase?.url,
        userId: user._id,
      });
    }

    const after = Date.now();
    const duration = after - before;
    console.log(`Operation took ${duration / 1000} seconds`);
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    return await this.userModel.findById(id).exec();
  }

  async update(
    id: string,
    body: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<User | null> {
    try {
      const before = Date.now();

      const user = await this.userModel
        .findByIdAndUpdate({ _id: id }, body, {
          new: true,
        })
        .exec();

      if (!user) {
        throw new NotFoundException(`User with id ${id} not found`);
      }

      if (file) {
        const file_path = `${prefix_public_user_file}/${Date.now()}_${file.originalname}`;
        const uploadToSupabase = await this.supabaseService.uploadImage(
          file_path,
          file,
        );

        if (!uploadToSupabase?.path) {
          throw new InternalServerErrorException(
            'Failed to upload image to Supabase',
          );
        }
        const oldAsset = await this.userAssetModel
          .findOneAndDelete({
            userId: new mongoose.Types.ObjectId(id),
          })
          .select('path');

        if (oldAsset) {
          await this.supabaseService.deleteImage(oldAsset?.path);
        }
        await this.userAssetModel.create({
          type: file.mimetype,
          path: uploadToSupabase?.path,
          publicUrl: uploadToSupabase?.url,
          userId: new mongoose.Types.ObjectId(id),
        });
      }
      const after = Date.now();
      const duration = after - before;
      console.log(`Operation took ${duration / 1000} seconds`);

      return user;
    } catch (err: any) {
      this.logger.error(`Failed to update user: ${err.message}`);
      throw err;
    }
  }

  async delete(id: string): Promise<User | null> {
    const user = this.userModel.findByIdAndDelete(id).exec();
    return user;
  }
}
