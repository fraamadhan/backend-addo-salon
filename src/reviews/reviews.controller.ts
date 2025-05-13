import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ParamsReviewDto } from './dto/review.dto';
import Logger from 'src/logger';
import { responseError, responseSuccess } from 'src/utils/response';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import { RoleType } from 'src/types/role';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  private readonly logger = new Logger();

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  async create(@Body() body: CreateReviewDto) {
    try {
      const data = await this.reviewsService.create(body);

      return responseSuccess(
        HttpStatus.CREATED,
        'Ulasan berhasil dibuat',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[REVIEW - create] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status as number, error.response as string);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  @Get()
  async findAll(@Query() params: ParamsReviewDto) {
    try {
      const data = await this.reviewsService.findAll(params);

      return responseSuccess(HttpStatus.OK, 'Ulasan berhasil ditemukan', data);
    } catch (error: any) {
      this.logger.error(`[REVIEW - get reviews] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status as number, error.response as string);
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
      const data = await this.reviewsService.findOne(id);

      return responseSuccess(HttpStatus.OK, 'Ulasan berhasil ditemukan', data);
    } catch (error: any) {
      this.logger.error(`[REVIEW - get review] ${error}`);
      if (error.response && error.status) {
        return responseError(error.status as number, error.response as string);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }

  // It’s not currently needed for the development phase.
  // @Patch(':id')
  // update(@Param('id') id: string, @Body() body: UpdateReviewDto) {
  //   return this.reviewsService.update(+id, body);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.reviewsService.remove(+id);
  // }
}
