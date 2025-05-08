import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import Logger from 'src/logger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import { RoleType } from 'src/types/role';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserUpdateDto } from './dto/user.dto';
import { responseError, responseSuccess } from 'src/utils/response';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParamsSearchUserDto } from './dto/search.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private readonly logger = new Logger();

  @Get()
  async findAll(@Query() params: ParamsSearchUserDto) {
    try {
      const data = await this.usersService.findAll(params);

      return responseSuccess(HttpStatus.OK, 'User fetched successfully', data);
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
      const data = await this.usersService.findOne(id);
      return responseSuccess(HttpStatus.OK, 'User fetched successfully', data);
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() body: UserUpdateDto,
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
      const data = await this.usersService.update(id, body, file);

      return responseSuccess(HttpStatus.OK, 'User updated successfully', data);
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

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async remove(@Param('id') id: string) {
    try {
      const data = await this.usersService.remove(id);

      return responseSuccess(HttpStatus.OK, 'User deleted successfully', {
        deletedData: data,
      });
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
}
