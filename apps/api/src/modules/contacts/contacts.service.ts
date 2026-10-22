import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactQueryDto } from './dto/contact-query.dto';
import { ContactStatsDto, PaginatedResult } from '@crm/shared-types';
import { Prisma } from '@crm/database';

@Injectable()
export class ContactsService {
  private readonly logger = new Logger(ContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new Contact with tenant isolation & optional company linking
   */
  async create(organizationId: string, dto: CreateContactDto) {
    const emailNorm = dto.email.trim().toLowerCase();

    return this.prisma.$transaction(async (tx) => {
      // If contact is marked primary, demote other contacts for this company
      if (dto.isPrimary && dto.companyId) {
        await tx.contact.updateMany({
          where: { organizationId, companyId: dto.companyId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const contact = await tx.contact.create({
        data: {
          organizationId,
          companyId: dto.companyId ?? null,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: emailNorm,
          phone: dto.phone?.trim() ?? null,
          mobilePhone: dto.mobilePhone?.trim() ?? null,
          jobTitle: dto.jobTitle?.trim() ?? null,
          department: dto.department?.trim() ?? null,
          isPrimary: dto.isPrimary ?? false,
        },
        include: {
          company: {
            select: { id: true, name: true, domain: true },
          },
        },
      });

      return contact;
    });
  }

  /**
   * Query contacts with search, company filtering, and pagination
   */
  async findAll(organizationId: string, query: ContactQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      companyId,
      department,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ContactWhereInput = {
      organizationId,
      isArchived: false,
      ...(companyId ? { companyId } : {}),
      ...(department ? { department } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { jobTitle: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const validSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [items, totalItems] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          company: {
            select: { id: true, name: true, domain: true },
          },
        },
      }),
      this.prisma.contact.count({ where }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Find single contact by ID with complete relationships
   */
  async findOne(organizationId: string, id: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id, organizationId, isArchived: false },
      include: {
        company: true,
        deals: {
          where: { isArchived: false },
          include: {
            stage: { select: { id: true, name: true, color: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!contact) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    return contact;
  }

  /**
   * Update contact details
   */
  async update(organizationId: string, id: string, dto: UpdateContactDto) {
    const existing = await this.prisma.contact.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!existing) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // If setting isPrimary to true, demote others
      if (dto.isPrimary && (dto.companyId || existing.companyId)) {
        const targetCompanyId = dto.companyId || existing.companyId;
        if (targetCompanyId) {
          await tx.contact.updateMany({
            where: {
              organizationId,
              companyId: targetCompanyId,
              isPrimary: true,
              id: { not: id },
            },
            data: { isPrimary: false },
          });
        }
      }

      const updated = await tx.contact.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
          ...(dto.email !== undefined && { email: dto.email.trim().toLowerCase() }),
          ...(dto.phone !== undefined && { phone: dto.phone?.trim() ?? null }),
          ...(dto.mobilePhone !== undefined && { mobilePhone: dto.mobilePhone?.trim() ?? null }),
          ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle?.trim() ?? null }),
          ...(dto.department !== undefined && { department: dto.department?.trim() ?? null }),
          ...(dto.companyId !== undefined && { companyId: dto.companyId }),
          ...(dto.isPrimary !== undefined && { isPrimary: dto.isPrimary }),
        },
        include: {
          company: { select: { id: true, name: true, domain: true } },
        },
      });

      return updated;
    });
  }

  /**
   * Soft delete / archive contact
   */
  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.contact.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!existing) {
      throw new NotFoundException(`Contact with ID "${id}" not found`);
    }

    await this.prisma.contact.update({
      where: { id },
      data: { isArchived: true },
    });

    return { success: true, message: `Contact "${existing.firstName} ${existing.lastName}" archived successfully` };
  }

  /**
   * Aggregate contact statistics
   */
  async getStats(organizationId: string): Promise<ContactStatsDto> {
    const [totalContacts, primaryContacts, contactsWithCompany] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId, isArchived: false } }),
      this.prisma.contact.count({ where: { organizationId, isArchived: false, isPrimary: true } }),
      this.prisma.contact.count({
        where: { organizationId, isArchived: false, companyId: { not: null } },
      }),
    ]);

    return {
      totalContacts,
      primaryContacts,
      contactsWithCompany,
    };
  }
}
