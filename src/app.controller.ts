import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';
import { User } from './schemas/user.schema';

class CreateUserDto {
  readonly name!: string;
  readonly age!: number | undefined;
  readonly sex: string | undefined | null;
}

class UpdateUserDto {
  readonly name?: string;
  readonly age?: number;
  readonly sex?: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async findAll(): Promise<User[]> {
    return this.appService.findAll();
  }

  @Post()
  async create(@Body() body: CreateUserDto): Promise<User> {
    return this.appService.create(body);
  }

  // @Get(':id')
  // async findOne(@Param('id') id: string): Promise<User | null> {
  //   return this.appService.findOne(id);
  // }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ): Promise<User | null> {
    return this.appService.update(id, body);
  }
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<User | null> {
    return this.appService.delete(id);
  }
  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }
}
