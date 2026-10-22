import {
  Controller,
  Get,
  Post,
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
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { BatchSetCustomFieldsDto } from './dto/batch-set-custom-fields.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { EntityType, UserRole } from '@crm/shared-types';

@ApiTags('Custom Fields')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Post('definitions')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Define a new dynamic custom field for an entity' })
  @ApiResponse({ status: 201, description: 'Custom field definition created' })
  async createDefinition(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateCustomFieldDefinitionDto,
  ) {
    return this.customFieldsService.createDefinition(orgId, dto);
  }

  @Get('definitions')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Query custom field definitions for entity' })
  @ApiQuery({ name: 'entityType', enum: EntityType, required: false })
  @ApiResponse({ status: 200, description: 'List of custom field definitions' })
  async getDefinitions(
    @CurrentUser('organizationId') orgId: string,
    @Query('entityType') entityType?: EntityType,
  ) {
    return this.customFieldsService.getDefinitions(orgId, entityType);
  }

  @Delete('definitions/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a custom field definition' })
  @ApiParam({ name: 'id', description: 'Definition ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation' })
  async deleteDefinition(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.customFieldsService.deleteDefinition(orgId, id);
  }

  @Post('values/:entityType/:entityId')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Batch set and validate custom field values for a specific record' })
  @ApiParam({ name: 'entityType', enum: EntityType })
  @ApiParam({ name: 'entityId', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Stored custom field values' })
  async setValues(
    @CurrentUser('organizationId') orgId: string,
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
    @Body() dto: BatchSetCustomFieldsDto,
  ) {
    return this.customFieldsService.setValues(orgId, entityType, entityId, dto.fields);
  }

  @Get('values/:entityType/:entityId')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Retrieve custom field values for a specific record' })
  @ApiParam({ name: 'entityType', enum: EntityType })
  @ApiParam({ name: 'entityId', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Key-value map of custom field values' })
  async getValues(
    @CurrentUser('organizationId') orgId: string,
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.customFieldsService.getValues(orgId, entityType, entityId);
  }
}
