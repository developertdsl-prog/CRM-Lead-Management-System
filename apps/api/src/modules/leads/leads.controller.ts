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
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { DeduplicationService } from './deduplication.service';
import { CsvService } from './csv.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { ImportLeadsDto } from './dto/import-leads.dto';
import { AddNoteDto } from './dto/add-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Leads')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly deduplicationService: DeduplicationService,
    private readonly csvService: CsvService,
  ) {}

  @Post()
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create new lead with tenant isolation' })
  @ApiResponse({ status: 201, description: 'Lead successfully created' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(user.organizationId, dto, user.userId);
  }

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Query leads with filters, search, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated lead records' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: LeadQueryDto,
  ) {
    return this.leadsService.findAll(orgId, query);
  }

  @Get('stats')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get aggregated lead pipeline metrics and statistics' })
  @ApiResponse({ status: 200, description: 'Lead pipeline statistics' })
  async getStats(@CurrentUser('organizationId') orgId: string) {
    return this.leadsService.getStats(orgId);
  }

  @Get('duplicates')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Find all duplicate clusters across organization' })
  @ApiResponse({ status: 200, description: 'Duplicate lead clusters' })
  async findDuplicates(@CurrentUser('organizationId') orgId: string) {
    return this.deduplicationService.findOrganizationDuplicates(orgId);
  }

  @Post('check-duplicate')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Pre-flight duplicate check for email, phone, or company' })
  @ApiResponse({ status: 200, description: 'Duplicate check outcome and candidate matches' })
  async checkDuplicate(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CheckDuplicateDto,
  ) {
    return this.deduplicationService.checkDuplicate(orgId, dto);
  }

  @Get('export')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Export leads to CSV format' })
  @ApiResponse({ status: 200, description: 'CSV file download or text content' })
  async exportLeads(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: LeadQueryDto,
    @Res() res: Response,
  ) {
    const csvContent = await this.leadsService.exportLeads(orgId, query);
    const filename = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(HttpStatus.OK).send(csvContent);
  }

  @Post('import')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Bulk import leads with deduplication strategy' })
  @ApiResponse({ status: 200, description: 'Import processing summary' })
  async importLeads(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: ImportLeadsDto,
  ) {
    return this.leadsService.importLeads(
      user.organizationId,
      dto.leads,
      dto.onDuplicate,
      user.userId,
    );
  }

  @Post('import/csv-raw')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Parse and bulk import raw CSV content' })
  @ApiResponse({ status: 200, description: 'Import processing summary' })
  async importRawCsv(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body('csv') csvText: string,
    @Body('onDuplicate') onDuplicate?: 'SKIP' | 'UPDATE' | 'IMPORT_ANYWAY',
  ) {
    if (!csvText) {
      throw new BadRequestException('Raw CSV text is required in "csv" parameter');
    }

    const { rows, errors } = this.csvService.parseLeadCsv(csvText);

    if (rows.length === 0 && errors.length > 0) {
      throw new BadRequestException({ message: 'Failed to parse CSV', errors });
    }

    const result = await this.leadsService.importLeads(
      user.organizationId,
      rows,
      onDuplicate || 'SKIP',
      user.userId,
    );

    return {
      ...result,
      parsingErrors: errors,
    };
  }

  @Get(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get single lead by ID with details and relations' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Lead entity' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update lead and track status transitions' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Updated lead entity' })
  async update(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(user.organizationId, id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Archive/soft-delete a lead' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.remove(orgId, id);
  }

  @Post(':id/convert')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Atomically convert lead to Contact, Company, and Deal' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 201, description: 'Converted entities in ACID transaction' })
  async convertLead(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
  ) {
    return this.leadsService.convertLead(user.organizationId, id, dto, user.userId);
  }

  @Post(':id/notes')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Add note to lead timeline' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 201, description: 'Created activity note' })
  async addNote(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id') id: string,
    @Body() dto: AddNoteDto,
  ) {
    return this.leadsService.addNote(user.organizationId, id, dto.note, user.userId);
  }

  @Get(':id/timeline')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get chronological activity and status transition timeline' })
  @ApiParam({ name: 'id', description: 'Lead ID' })
  @ApiResponse({ status: 200, description: 'Chronological timeline entries' })
  async getTimeline(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.leadsService.getTimeline(orgId, id);
  }
}
