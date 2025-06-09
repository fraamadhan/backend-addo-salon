import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  HttpStatus,
  UseGuards,
  HttpException,
  Query,
  Put,
  Post,
} from '@nestjs/common';
import { CmsTransactionService } from './transaction.service';
import {
  CmsCreateTransactionDto,
  CmsUpdateTransactionDto,
  TransactionQueryParams,
  UpdateScheduleDto,
} from './dto/cms-transaction.dto';
import { ReservationStatus } from 'src/types/enum';
import { responseError, responseSuccess } from 'src/utils/response';
import Logger from 'src/logger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import { RoleType } from 'src/types/role';

@Controller('cms/transaction')
export class CmsTransactionController {
  constructor(private readonly transactionService: CmsTransactionService) {}

  private readonly logger = new Logger();

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async createTransaction(@Body() body: CmsCreateTransactionDto) {
    try {
      const data = await this.transactionService.createTransaction(body);

      return responseSuccess(HttpStatus.CREATED, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionController - create transaction] ${error as string}`,
      );
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async getOrders(@Query() params: TransactionQueryParams) {
    try {
      const data = await this.transactionService.getOrders(params);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionController - get orders] ${error as string}`,
      );
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Internal server error: ${error as string}`,
      );
    }
  }

  @Get('/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async getHistory(@Query() params: TransactionQueryParams) {
    try {
      const data = await this.transactionService.getTransactions(params);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionController - get transactions] ${error as string}`,
      );
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Internal server error: ${error as string}`,
      );
    }
  }

  @Get('/history/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async findHistory(@Param('id') id: string) {
    try {
      const data = await this.transactionService.findHistoryTransaction(id);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionController - find detail history] ${error as string}`,
      );
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Get('/order/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async findOrder(@Param('id') id: string) {
    try {
      const data = await this.transactionService.findOrder(id);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionController - find detail order] ${error as string}`,
      );
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Put('/order/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async updateOrder(
    @Param('id') id: string,
    @Body() body: CmsUpdateTransactionDto,
  ) {
    try {
      const data = await this.transactionService.updateOrder(id, body);

      if (data) return responseSuccess(HttpStatus.OK, 'Success');
    } catch (error) {
      this.logger.errorString(
        `[CMS TransactionController - update order] ${error as string}`,
      );
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Patch('/status/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: ReservationStatus,
  ) {
    try {
      const result = await this.transactionService.updateStatus(id, status);

      if (result) {
        return responseSuccess(HttpStatus.OK, 'Update status success');
      }
    } catch (error: any) {
      this.logger.errorString(
        `[CMS TransactionController - update status] ${error as string}`,
      );
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Internal server error: ${error as string}`,
      );
    }
  }

  @Patch('/schedule/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async updateSchedule(
    @Param('id') id: string,
    @Body() body: UpdateScheduleDto,
  ) {
    try {
      const result = await this.transactionService.updateSchedule(id, body);

      if (result) {
        return responseSuccess(HttpStatus.OK, 'Update schedule success');
      }
    } catch (error: any) {
      this.logger.errorString(
        `[CMS TransactionController - update schedule] ${error as string}`,
      );
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Internal server error: ${error as string}`,
      );
    }
  }
}
