import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { UpsertAccountDto } from './dto/account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Companies')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create new company & initialize account metadata' })
  @ApiResponse({ status: 201, description: 'Company successfully created' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateCompanyDto,
  ) {
    return this.companiesService.create(user.organizationId, dto, user.userId);
  }

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Query companies directory with search, industry filter, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated company list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: CompanyQueryDto,
  ) {
    return this.companiesService.findAll(orgId, query);
  }

  @Get('stats')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get aggregated companies & accounts metrics (MRR, health scores)' })
  @ApiResponse({ status: 200, description: 'Company & account statistics' })
  async getStats(@CurrentUser('organizationId') orgId: string) {
    return this.companiesService.getStats(orgId);
  }

  @Get(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get single company profile by ID' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Company entity' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.findOne(orgId, id);
  }

  @Get(':id/account-360')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get comprehensive Account 360° intelligence view' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Aggregated Account 360 data' })
  async getAccount360(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.getAccount360(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update company properties' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Updated company entity' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Archive/soft-delete company' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.companiesService.remove(orgId, id);
  }

  @Put(':id/account')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update or initialize Account 360 metadata (Health Score, MRR, Status)' })
  @ApiParam({ name: 'id', description: 'Company ID' })
  @ApiResponse({ status: 200, description: 'Upserted Account record' })
  async upsertAccount(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') companyId: string,
    @Body() dto: UpsertAccountDto,
  ) {
    return this.companiesService.upsertAccount(orgId, companyId, dto);
  }
}
