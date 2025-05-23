import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import Logger from 'src/logger';
import { responseError, responseSuccess } from 'src/utils/response';
import { DashboardDto } from './dto/dashboard.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/utils/custom-decorator/roles.decorator';
import { RoleType } from 'src/types/role';

@Controller('cms/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  private readonly logger = new Logger();

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async findDataDashboard(@Query() params: DashboardDto) {
    try {
      const data = await this.dashboardService.getData(params);

      return responseSuccess(HttpStatus.OK, 'Success', data);
    } catch (error) {
      this.logger.errorString(
        `[CMS DashboardController - findDataDashbiard] ${error as string}`,
      );

      return responseError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
      );
    }
  }
}
