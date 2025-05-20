import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Req,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import {
  CalculateBillDto,
  ChargeDto,
  CollectBillDto,
} from './dto/transaction-dto';
import { UpdateTransactionDto } from './dto/transaction-dto';
import Logger from 'src/logger';
import { responseError, responseSuccess } from 'src/utils/response';
import { Request } from 'express';
import { UserPayload } from 'src/types/general';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { RoleType } from 'src/types/role';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  private readonly logger = new Logger();
  // payment to midtrans
  @Post('/pay')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  async pay(@Req() req: Request, @Body() body: ChargeDto) {
    const userId = (req.user as UserPayload)._id;
    try {
      const data = await this.transactionService.pay(body, userId);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error: any) {
      if (error instanceof HttpException) {
        return responseError(error.getStatus(), error.message);
      }
      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  // save to db after "buy on cart page"
  @Post('/collect-bill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  async collectBill(@Req() request: Request, @Body() body: CollectBillDto) {
    const userId = (request.user as UserPayload)._id;
    try {
      const data = await this.transactionService.collectBill(body, userId);

      return responseSuccess(HttpStatus.CREATED, 'Success', data);
    } catch (error: any) {
      this.logger.errorString(
        `[TransactionController - collect bill] ${error as string}`,
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

  @Post('/notification')
  async handleAfterPayment(@Body() body: Record<string, any>) {
    try {
      const result = await this.transactionService.handleAfterPayment(body);

      if (result) {
        return responseSuccess(HttpStatus.OK, 'Success');
      } else {
        throw new HttpException('Fraud terdeteksi', HttpStatus.BAD_REQUEST);
      }
    } catch (error: any) {
      this.logger.error(error as string);
      this.logger.error(`Error occured during handling after payment midtrans`);

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Post('/calculate-bill')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  async calculateBill(@Req() req: Request, @Body() body: CalculateBillDto) {
    const userId = (req.user as UserPayload)._id;
    try {
      const data = await this.transactionService.calculateBill(body, userId);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error: any) {
      this.logger.errorString(
        `[TransactionController - calculate bill] ${error as string}`,
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

  @Get()
  findAll() {
    return this.transactionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(+id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionService.remove(+id);
  }
}
