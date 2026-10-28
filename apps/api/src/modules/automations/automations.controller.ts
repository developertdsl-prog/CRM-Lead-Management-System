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
} from '@nestjs/swagger';
import { AutomationsService } from './automations.service';
import { CreateAutomationRuleDto, AutomationTriggerEnum } from './dto/create-automation-rule.dto';
import { UpdateAutomationRuleDto } from './dto/update-automation-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Automations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('rules')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get all automation rules for organization' })
  @ApiResponse({ status: 200, description: 'List of rules' })
  async findAll(@CurrentUser('organizationId') orgId: string) {
    return this.automationsService.findAll(orgId);
  }

  @Post('rules')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create an automation rule' })
  @ApiResponse({ status: 201, description: 'Automation rule created' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateAutomationRuleDto,
  ) {
    return this.automationsService.create(orgId, dto);
  }

  @Get('rules/:id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get a specific automation rule with execution history' })
  @ApiResponse({ status: 200, description: 'Rule details' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.automationsService.findOne(orgId, id);
  }

  @Patch('rules/:id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update an automation rule' })
  @ApiResponse({ status: 200, description: 'Rule updated' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAutomationRuleDto,
  ) {
    return this.automationsService.update(orgId, id, dto);
  }

  @Patch('rules/:id/toggle')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Toggle active status of an automation rule' })
  @ApiResponse({ status: 200, description: 'Rule toggled' })
  async toggleStatus(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.automationsService.toggleStatus(orgId, id);
  }

  @Delete('rules/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete an automation rule' })
  @ApiResponse({ status: 200, description: 'Rule deleted' })
  async delete(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.automationsService.delete(orgId, id);
  }

  @Get('executions')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get recent automation execution log history' })
  @ApiResponse({ status: 200, description: 'Execution logs' })
  async getExecutions(
    @CurrentUser('organizationId') orgId: string,
    @Query('ruleId') ruleId?: string,
  ) {
    return this.automationsService.getExecutions(orgId, ruleId);
  }

  @Post('test-trigger')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Manually trigger an automation event for testing' })
  @ApiResponse({ status: 200, description: 'Trigger processed' })
  async testTrigger(
    @CurrentUser('organizationId') orgId: string,
    @Body() body: { trigger: AutomationTriggerEnum; payload?: any },
  ) {
    return this.automationsService.triggerEvent(
      orgId,
      body.trigger || AutomationTriggerEnum.LEAD_CREATED,
      body.payload || { title: 'Test Trigger Execution' },
    );
  }
}
