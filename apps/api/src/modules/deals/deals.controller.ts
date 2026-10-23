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
  ApiQuery,
} from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { ChangeDealStageDto } from './dto/change-deal-stage.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Deals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new deal opportunity' })
  @ApiResponse({ status: 201, description: 'Deal created successfully' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateDealDto,
  ) {
    return this.dealsService.create(user.organizationId, dto, user.userId);
  }

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Query deals with pagination, search, and filters' })
  @ApiResponse({ status: 200, description: 'Paginated list of deals' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: DealQueryDto,
  ) {
    return this.dealsService.findAll(orgId, query);
  }

  @Get('forecast')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get weighted revenue forecast and stage breakdown metrics' })
  @ApiQuery({ name: 'pipelineId', required: false, description: 'Optional specific pipeline ID' })
  @ApiResponse({ status: 200, description: 'Weighted forecast metrics' })
  async getForecast(
    @CurrentUser('organizationId') orgId: string,
    @Query('pipelineId') pipelineId?: string,
  ) {
    return this.dealsService.getForecast(orgId, pipelineId);
  }

  @Get(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get detailed deal profile by ID' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal entity with relations and custom fields' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.dealsService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update deal properties' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Updated deal entity' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(orgId, id, dto);
  }

  @Patch(':id/stage')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Move deal stage (Kanban drag-and-drop movement)' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal transitioned successfully' })
  async changeStage(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: ChangeDealStageDto,
  ) {
    return this.dealsService.changeStage(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Archive / soft-delete deal' })
  @ApiParam({ name: 'id', description: 'Deal ID' })
  @ApiResponse({ status: 200, description: 'Deal archived successfully' })
  async delete(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.dealsService.delete(orgId, id);
  }
}
