import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductDto, UpdateProductDto } from './dto/product.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import Logger from 'src/logger';
import { responseError, responseSuccess } from 'src/utils/response';
import { ParamsSearchProductDto } from './dto/search.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private readonly logger = new Logger();

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() body: ProductDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /image\/(jpeg|png)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5_000_000,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    try {
      const data = await this.productsService.create(body, file);

      return responseSuccess(
        HttpStatus.CREATED,
        'Produt created successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[PRODUCT - create] ${error}`);
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
  async findAll(@Query() params: ParamsSearchProductDto) {
    try {
      const data = await this.productsService.findAll(params);

      return responseSuccess(
        HttpStatus.OK,
        'Products fetched successfully',
        data,
      );
    } catch (error: any) {
      this.logger.errorString(error as string);
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
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.productsService.findOne(id);

      return responseSuccess(
        HttpStatus.OK,
        'Product fetched successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[PRODUCT - create] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /image\/(jpeg|png)$/,
        })
        .addMaxSizeValidator({
          maxSize: 5_000_000,
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      const data = await this.productsService.update(id, body, file);

      return responseSuccess(
        HttpStatus.OK,
        'Product updated successfully',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[PRODUCT - update] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const data = await this.productsService.remove(id);

      return responseSuccess(HttpStatus.OK, 'Product deleted successfully', {
        deletedData: data,
      });
    } catch (error: any) {
      this.logger.error(`[PRODUCT - delete] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }
}
