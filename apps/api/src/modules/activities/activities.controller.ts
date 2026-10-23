import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new activity (Task, Call, Meeting, Note, Email)' })
  @ApiResponse({ status: 201, description: 'Activity created' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.organizationId, dto, user.userId);
  }

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Query activities with filters and overdue detection' })
  @ApiResponse({ status: 200, description: 'List of activities' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: ActivityQueryDto,
  ) {
    return this.activitiesService.findAll(orgId, query);
  }

  @Get('stats')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get summary statistics of tasks & overdue items' })
  @ApiResponse({ status: 200, description: 'Activity summary statistics' })
  async getStats(@CurrentUser('organizationId') orgId: string) {
    return this.activitiesService.getStats(orgId);
  }

  @Get(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get single activity by ID' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity entity' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update activity properties' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Updated activity' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(orgId, id, dto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Quick action to mark activity as completed' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity completed' })
  async markComplete(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body('outcome') outcome?: string,
  ) {
    return this.activitiesService.markComplete(orgId, id, outcome);
  }

  @Delete(':id')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete an activity' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, description: 'Activity deleted' })
  async delete(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.activitiesService.delete(orgId, id);
  }
}
