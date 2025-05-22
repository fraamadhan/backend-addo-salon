import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from 'src/schemas/employee.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Employee.name,
        schema: EmployeeSchema,
      },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService, JwtService],
})
export class EmployeeModule {}
