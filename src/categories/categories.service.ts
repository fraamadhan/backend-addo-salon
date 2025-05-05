import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from 'src/schemas/category.schema';
import mongoose, { Model } from 'mongoose';
import Logger from 'src/logger';

interface CategoryWithParent {
  name: string;
  slug: string;
  code: number;
  parentId?: string;
  parentName?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  private readonly logger = new Logger();

  async create(body: CreateCategoryDto) {
    try {
      const data = await this.categoryModel.create(body);

      return data;
    } catch (error: any) {
      this.logger.error(`[CategoriesService] - create ${error}`);
      throw new HttpException(
        `Error occured: ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(keyword: string) {
    try {
      const data = await this.categoryModel.aggregate<CategoryWithParent>([
        {
          $lookup: {
            from: 'categories',
            localField: 'parentId',
            foreignField: '_id',
            as: 'parent',
          },
        },
        { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $or: [
              { name: { $regex: keyword, $options: 'i' } },
              { 'parent.name': { $regex: keyword, $options: 'i' } },
            ],
          },
        },
        {
          $project: {
            name: 1,
            slug: 1,
            code: 1,
            parentId: '$parent._id',
            parentName: '$parent.name',
            parentSlug: '$parent.slug',
            parentCode: '$parent.code',
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      return data;
    } catch (error: any) {
      this.logger.error(`[CategoriesService] - findAll ${error}`);
      throw new HttpException(
        `Error occured: ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOne(id: string) {
    try {
      const data = await this.categoryModel
        .findById(id)
        .populate('parentId')
        .exec();

      return data;
    } catch (error: any) {
      this.logger.error(`[CategoriesService] - findAll ${error}`);
      throw new HttpException(
        `Error occured: ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async update(id: string, body: UpdateCategoryDto) {
    const { parentId } = body;

    body.parentId = parentId
      ? new mongoose.Types.ObjectId(parentId)
      : undefined;

    try {
      const data = await this.categoryModel.findOneAndUpdate(
        {
          _id: id,
        },
        body,
      );

      return data;
    } catch (error: any) {
      this.logger.error(`[CategoriesServive] - update ${error}`);
      throw new HttpException(
        `Error occured: ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async remove(id: string) {
    try {
      const data = await this.categoryModel.findOneAndDelete({
        _id: id,
      });

      console.log(data);

      return data;
    } catch (error: any) {
      this.logger.error(`[CategoriesServive] - update ${error}`);
      throw new HttpException(
        `Error occured: ${error}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
