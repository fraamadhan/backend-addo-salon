import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { responseError, responseSuccess } from 'src/utils/response';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { RoleType } from 'src/types/role';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import Logger from 'src/logger';
import { PaginationParams } from 'src/types/pagination';
import { GetChooseEmployee } from 'src/cms/transaction/dto/cms-transaction.dto';

@Controller('employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  private readonly logger = new Logger();

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async create(@Body() body: CreateEmployeeDto) {
    try {
      const data = await this.employeeService.create(body);

      return responseSuccess(HttpStatus.CREATED, 'Employee data created', data);
    } catch (error: any) {
      this.logger.errorString(
        `[EmployeeController - create] ${error as string}`,
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async findAll(@Query() params: PaginationParams) {
    try {
      const data = await this.employeeService.findAll(params);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[EmployeeController - get employee] ${error as string}`,
      );

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Get('choose')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async chooseEmployees(@Query() body: GetChooseEmployee) {
    try {
      const data = await this.employeeService.getEmployees(body);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[EmployeeController - get choose employee] ${error as string}`,
      );

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.employeeService.findOne(id);

      return responseSuccess(HttpStatus.OK, 'Employee data fetched', data);
    } catch (error: any) {
      this.logger.errorString(
        `[EmployeeController - get by id] ${error as string}`,
      );
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async update(@Param('id') id: string, @Body() body: UpdateEmployeeDto) {
    try {
      const data = await this.employeeService.update(id, body);

      return responseSuccess(HttpStatus.OK, 'Employee data updated', data);
    } catch (error: any) {
      this.logger.errorString(
        `[EmployeeController - update] ${error as string}`,
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async remove(@Param('id') id: string) {
    try {
      const data = await this.employeeService.remove(id);

      return responseSuccess(HttpStatus.OK, 'Employee data deleted', {
        deletedData: data,
      });
    } catch (error: any) {
      this.logger.errorString(
        `[EmployeeController - delete] ${error as string}`,
      );
    }
  }
}
