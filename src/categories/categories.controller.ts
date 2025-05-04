import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { responseError, responseSuccess } from 'src/utils/response';
import Logger from 'src/logger';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  private readonly logger = new Logger();
  @Post()
  async create(@Body() body: CreateCategoryDto) {
    try {
      const data = await this.categoriesService.create(body);

      return responseSuccess(
        HttpStatus.CREATED,
        'Category created successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`Error occured: ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Get()
  async getCategories() {
    try {
      const data = await this.categoriesService.findAll();

      this.logger.log('[CATEGORIES CONTROLLER] - getCategories ');
      return responseSuccess(
        HttpStatus.OK,
        'Categories fetched successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[CATEGORIES CONTROLLER - getCategories] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Get(':id')
  async getCategory(@Param('id') id: string) {
    try {
      const data = await this.categoriesService.findOne(id);

      this.logger.log('[CATEGORIES CONTROLLER] - getCategory');

      return responseSuccess(
        HttpStatus.OK,
        'Category fetched successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[CATEGORIES CONTROLLER - getCategory] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Patch(':id')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    try {
      const data = await this.categoriesService.update(id, body);

      this.logger.log('[CATEGORIES CONTROLLER] - updateCategory');

      return responseSuccess(
        HttpStatus.OK,
        'Category updated successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[CATEGORIES CONTROLLER - updateCategory] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    try {
      const data = await this.categoriesService.remove(id);

      this.logger.log('[CATEGORIES CONTROLLER] - deleteCategory');

      return responseSuccess(
        HttpStatus.OK,
        'Category deleted successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[CATEGORIES CONTROLLER - getCategory] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }
}
