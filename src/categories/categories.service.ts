import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from 'src/schemas/category.schema';
import mongoose, { Model, Types } from 'mongoose';
import Logger from 'src/logger';

interface CategoryWithParent {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  code: number;
  parentId?: string;
  parentName?: string;
  parentSlug?: string;
  parentCode?: number;
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
      const { parentId } = body;
      if (parentId) {
        body.parentId = new mongoose.Types.ObjectId(parentId);
      }
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
            _id: 1,
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

      const parentMap = new Map<string, { parent: any; children: any[] }>();
      for (const item of data) {
        if (!item.parentId) {
          const parentKey = item._id.toString();
          parentMap.set(parentKey, {
            parent: {
              _id: item._id,
              name: item.name,
              slug: item.slug,
              code: item.code,
            },
            children: [],
          });
        }
      }
      for (const item of data) {
        if (item.parentId) {
          const parentKey = item.parentId.toString();
          if (parentMap.has(parentKey)) {
            const parentEntry = parentMap.get(parentKey);
            if (parentEntry) {
              parentEntry.children.push(item);
            }
          }
        }
      }

      const categories = Array.from(parentMap.values());

      return categories;
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
      const data = await this.categoryModel
        .findOneAndUpdate(
          {
            _id: id,
          },
          body,
        )
        .exec();

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
      const data = await this.categoryModel
        .findOneAndDelete({
          _id: id,
        })
        .exec();

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
