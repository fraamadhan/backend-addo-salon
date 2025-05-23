import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class DashboardDto {
  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  threeMonth?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  oneMonth?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  sixMonth?: boolean;
}
