import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PipelinesService } from './pipelines.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Pipelines')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'List all pipelines with stages and deal metrics for current organization' })
  @ApiResponse({ status: 200, description: 'List of pipelines' })
  async findAll(@CurrentUser('organizationId') orgId: string) {
    return this.pipelinesService.findAll(orgId);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a new sales pipeline' })
  @ApiResponse({ status: 201, description: 'Pipeline created successfully' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreatePipelineDto,
  ) {
    return this.pipelinesService.create(orgId, dto);
  }

  @Get(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get single pipeline by ID with ordered stages' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Pipeline details' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update pipeline properties' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Pipeline updated' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePipelineDto,
  ) {
    return this.pipelinesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a pipeline (must not be default or contain active deals)' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Pipeline deleted' })
  async delete(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.pipelinesService.delete(orgId, id);
  }

  @Post(':id/stages')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Add a new stage to a pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 201, description: 'Stage created' })
  async createStage(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') pipelineId: string,
    @Body() dto: CreateStageDto,
  ) {
    return this.pipelinesService.createStage(orgId, pipelineId, dto);
  }

  @Patch(':id/stages/:stageId')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update stage properties' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({ status: 200, description: 'Stage updated' })
  async updateStage(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
    @Body() dto: UpdateStageDto,
  ) {
    return this.pipelinesService.updateStage(orgId, pipelineId, stageId, dto);
  }

  @Delete(':id/stages/:stageId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a stage from pipeline (must contain no active deals)' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiParam({ name: 'stageId', description: 'Stage ID' })
  @ApiResponse({ status: 200, description: 'Stage deleted' })
  async deleteStage(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') pipelineId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.pipelinesService.deleteStage(orgId, pipelineId, stageId);
  }

  @Put(':id/stages/reorder')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Reorder stages within a pipeline' })
  @ApiParam({ name: 'id', description: 'Pipeline ID' })
  @ApiResponse({ status: 200, description: 'Stages reordered successfully' })
  async reorderStages(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') pipelineId: string,
    @Body() dto: ReorderStagesDto,
  ) {
    return this.pipelinesService.reorderStages(orgId, pipelineId, dto);
  }
}
