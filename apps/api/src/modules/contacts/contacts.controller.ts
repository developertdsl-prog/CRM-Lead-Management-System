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
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Contacts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create new contact profile' })
  @ApiResponse({ status: 201, description: 'Contact successfully created' })
  async create(
    @CurrentUser('organizationId') orgId: string,
    @Body() dto: CreateContactDto,
  ) {
    return this.contactsService.create(orgId, dto);
  }

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Query contacts directory with company filter, search, and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated contact list' })
  async findAll(
    @CurrentUser('organizationId') orgId: string,
    @Query() query: ContactQueryDto,
  ) {
    return this.contactsService.findAll(orgId, query);
  }

  @Get('stats')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get aggregated contact metrics' })
  @ApiResponse({ status: 200, description: 'Contact statistics' })
  async getStats(@CurrentUser('organizationId') orgId: string) {
    return this.contactsService.getStats(orgId);
  }

  @Get(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get single contact profile by ID' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Contact entity' })
  async findOne(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.contactsService.findOne(orgId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Update contact details' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Updated contact entity' })
  async update(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Archive/soft-delete contact' })
  @ApiParam({ name: 'id', description: 'Contact ID' })
  @ApiResponse({ status: 200, description: 'Deletion confirmation' })
  async remove(
    @CurrentUser('organizationId') orgId: string,
    @Param('id') id: string,
  ) {
    return this.contactsService.remove(orgId, id);
  }
}
