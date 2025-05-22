import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './employee.dto';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
