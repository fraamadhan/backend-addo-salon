import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserCreateDto, UserUpdateDto } from './dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import mongoose, { Model, PaginateModel } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { prefix_public_user_file } from 'src/file-path';
import { SupabaseService } from 'src/supabase/supabase.service';
import { UserAssets, UserAssetsDocument } from 'src/schemas/user-assets.schema';
import Logger from 'src/logger';
import { sanitizeKeyword } from 'src/utils/sanitize-keyword';
import { SortType } from 'src/types/sorttype';
import { PaginationParams } from 'src/types/pagination';
import { RoleType } from 'src/types/role';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: PaginateModel<UserDocument>,
    @InjectModel(UserAssets.name)
    private readonly userAssetModel: Model<UserAssetsDocument>,
    private readonly supabaseService: SupabaseService,
  ) {}

  private readonly logger = new Logger();

  async findAll(params: PaginationParams) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    let keywordSanitized = '';
    let query = {};
    const sortby: any = params?.sortby;
    const sorttype = params.sorttype === SortType.asc ? 1 : -1;

    const sort: Record<string, 1 | -1> = {
      [sortby]: sorttype,
      updatedAt: -1,
    };

    if (params.keyword) {
      const result = sanitizeKeyword(params.keyword);

      keywordSanitized = result.keywordSanitized;
    }

    if (keywordSanitized.length !== 0) {
      query = {
        $or: [
          {
            name: {
              $regex: new RegExp(`${keywordSanitized}`, 'i'),
            },
          },
          {
            phone_number: {
              $regex: new RegExp(`${keywordSanitized}`, 'i'),
            },
          },
          {
            email: {
              $regex: new RegExp(`${params.keyword}`, 'i'),
            },
          },
        ],
      };
    }

    const result = await this.userModel.paginate(query, {
      page,
      limit,
      lean: true,
      sort,
      collation: {
        locale: 'en',
        strength: 1,
      },
      select: '-password',
    });

    const totalItem = result.totalDocs;
    const pageCount = result.totalPages;
    const hasPrevPage = result.hasPrevPage;
    const hasNextPage = result.hasNextPage;
    const prevPage = result.prevPage;
    const nextPage = result.nextPage;
    const users = result.docs;

    const paginator = {
      totalItem,
      limit,
      pageCount,
      page,
      hasPrevPage,
      hasNextPage,
      prevPage,
      nextPage,
    };

    return {
      users,
      paginator,
    };
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .select('-password')
      .lean()
      .exec();
    const asset = await this.userAssetModel.findOne({
      userId: new mongoose.Types.ObjectId(id),
    });
    if (!user) {
      throw new HttpException(
        `User with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    const data = { ...user, asset };

    return data;
  }

  async cmsAddUser(body: UserCreateDto, file?: Express.Multer.File) {
    const before = Date.now();

    body['is_verified'] = body.is_verified === 'false' ? false : true;

    try {
      if (body.email) {
        const existingUser = await this.userModel
          .findOne({
            email: body.email,
          })
          .exec();

        if (existingUser) {
          throw new HttpException(
            'Email has already been taken. Please choose another email',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (body.password) {
        const hashedPassword = await bcrypt.hash(body.password, 10);

        body.password = hashedPassword;
      }

      if (body.is_verified) {
        body.email_verified_at = new Date(Date.now());
      }

      const user = await this.userModel.create(body);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (file) {
        const file_path = `${prefix_public_user_file}/${Date.now()}_${file.originalname}`;

        const uploadToSupabase = await this.supabaseService.uploadImage(
          file_path,
          file,
        );

        if (!uploadToSupabase?.path) {
          throw new HttpException(
            'Failed to upload image to server',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        await this.userAssetModel.create({
          type: file.mimetype,
          path: uploadToSupabase.path,
          publicUrl: uploadToSupabase.url,
          userId: user._id,
        });
      }

      const after = Date.now();
      const duration = after - before;
      this.logger.log(`Operation update user took ${duration / 1000} seconds`);

      return user;
    } catch (error: any) {
      this.logger.error(`[UsersService] - update. Error occured: ${error}`);
      throw error;
    }
  }

  async update(id: string, body: UserUpdateDto, file?: Express.Multer.File) {
    const before = Date.now();

    body['is_verified'] = body.is_verified === 'false' ? false : true;

    try {
      if (
        (body.password && !body.confirmPassword) ||
        (!body.password && body.confirmPassword)
      ) {
        throw new HttpException(
          'Password and Confirm Password must be filled',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (body.email) {
        const existingUser = await this.userModel
          .findOne({
            email: body.email,
          })
          .exec();

        if (existingUser) {
          throw new HttpException(
            'Email has already been taken. Please choose another email',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (body.password !== body.confirmPassword) {
        throw new HttpException(
          'Password do not match',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        body.password &&
        body.confirmPassword &&
        body.role === RoleType.ADMIN
      ) {
        if (body.password !== body.confirmPassword) {
          throw new HttpException(
            'Konfirmasi kata sandi tidak cocok',
            HttpStatus.BAD_REQUEST,
          );
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);

        body.password = hashedPassword;
      }

      if (body.password && body.role === RoleType.USER) {
        if (!body.oldPassword) {
          throw new HttpException(
            'Kata sandi lama harus diisi',
            HttpStatus.BAD_REQUEST,
          );
        }
        const existingUser = await this.userModel.findById(id).exec();

        if (!existingUser) {
          throw new HttpException(
            'Pengguna tidak ditemukan',
            HttpStatus.BAD_REQUEST,
          );
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);
        const isMatch = await bcrypt.compare(
          body.oldPassword,
          existingUser?.password || '',
        );

        if (!isMatch) {
          throw new HttpException(
            'Kata sandi lama salah',
            HttpStatus.BAD_REQUEST,
          );
        }

        body.password = hashedPassword;
      }

      if (body.is_verified) {
        body.email_verified_at = new Date(Date.now());
      }

      const user = await this.userModel
        .findByIdAndUpdate(
          {
            _id: id,
          },
          body,
          {
            new: true,
          },
        )
        .select('-password')
        .lean()
        .exec();

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (file) {
        const file_path = `${prefix_public_user_file}/${Date.now()}_${file.originalname}`;

        const uploadToSupabase = await this.supabaseService.uploadImage(
          file_path,
          file,
        );

        if (!uploadToSupabase?.path) {
          throw new HttpException(
            'Failed to upload image to server',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }

        const oldAsset = await this.userAssetModel
          .findOneAndDelete({
            userId: new mongoose.Types.ObjectId(id),
          })
          .select('path')
          .exec();

        if (oldAsset) {
          await this.supabaseService.deleteImage(oldAsset?.path);
        }

        await this.userAssetModel.create({
          type: file.mimetype,
          path: uploadToSupabase.path,
          publicUrl: uploadToSupabase.url,
          userId: new mongoose.Types.ObjectId(id),
        });
      }

      const after = Date.now();
      const duration = after - before;
      this.logger.log(`Operation update user took ${duration / 1000} seconds`);

      return user;
    } catch (error: any) {
      this.logger.error(`[UsersService] - update. Error occured: ${error}`);
      throw error;
    }
  }

  async remove(id: string) {
    if (!id) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const result = await this.userModel
      .findOneAndDelete({
        _id: id,
      })
      .select('-password')
      .lean()
      .exec();

    const assetUser = await this.userAssetModel
      .findOneAndDelete({
        userId: new mongoose.Types.ObjectId(id),
      })
      .exec();

    if (assetUser) await this.supabaseService.deleteImage(assetUser?.path);

    if (!result) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return result;
  }
}
