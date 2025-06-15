import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  UseGuards,
  Query,
  HttpException,
  Req,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ParamsReviewDto } from './dto/review.dto';
import Logger from 'src/logger';
import { responseError, responseSuccess } from 'src/utils/response';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import { RoleType } from 'src/types/role';
import { Request } from 'express';
import { UserPayload } from 'src/types/general';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  private readonly logger = new Logger();

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  async create(@Req() req: Request, @Body() body: CreateReviewDto) {
    const userId = (req.user as UserPayload)._id;
    try {
      const data = await this.reviewsService.create(body, userId);

      return responseSuccess(
        HttpStatus.CREATED,
        'Ulasan berhasil dibuat',
        data,
      );
    } catch (error: any) {
      this.logger.error(`[REVIEW - create] ${error}`);
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
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
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
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
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal Server Error',
      );
    }
  }
}
