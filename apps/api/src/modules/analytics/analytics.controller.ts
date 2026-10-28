import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Analytics & Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get comprehensive aggregated analytics metrics for dashboard' })
  @ApiResponse({ status: 200, description: 'Analytics overview metrics' })
  async getDashboard(@CurrentUser('organizationId') orgId: string) {
    return this.analyticsService.getDashboardOverview(orgId);
  }

  @Get('export')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Export CRM data reports in CSV format' })
  async exportReport(
    @CurrentUser('organizationId') orgId: string,
    @Query('type') type: 'DEALS' | 'LEADS' | 'ACTIVITIES' = 'DEALS',
    @Res() res: Response,
  ) {
    const csvData = await this.analyticsService.exportReportCsv(orgId, type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type.toLowerCase()}-report-${Date.now()}.csv"`);
    return res.send(csvData);
  }
}
