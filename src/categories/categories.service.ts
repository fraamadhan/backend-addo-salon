import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from 'src/schemas/category.schema';
import { Model } from 'mongoose';
import Logger from 'src/logger';

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

  async findAll() {
    try {
      const data = await this.categoryModel.find().populate('parentId').exec();

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
