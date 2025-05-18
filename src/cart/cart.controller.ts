import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { responseError, responseSuccess } from 'src/utils/response';
import Logger from 'src/logger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import { RoleType } from 'src/types/role';
import { UserPayload } from 'src/types/general';
import { Request } from 'express';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private readonly logger = new Logger();

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  async create(@Req() req: Request, @Body() body: CreateCartDto) {
    const userId = (req.user as UserPayload)._id;
    try {
      const data = await this.cartService.create(body, userId);

      return responseSuccess(
        HttpStatus.CREATED,
        'Product added to cart!',
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

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.USER)
  async findAll(@Req() req: Request) {
    const userId = (req.user as UserPayload)._id;
    try {
      const data = await this.cartService.findAll(userId);

      return responseSuccess(HttpStatus.OK, 'Data fetched successfully', data);
    } catch (error: any) {
      this.logger.errorString(error as string);
      if (error.response && error.status) {
        return responseError(error.status, error.response);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(+id);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
  //   return this.cartService.update(+id, updateCartDto);
  // }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const data = await this.cartService.remove(id);

      return responseSuccess(HttpStatus.OK, 'Item deleted from cart', {
        deletedData: data,
      });
    } catch (error: any) {
      this.logger.errorString(error as string);
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }
}
