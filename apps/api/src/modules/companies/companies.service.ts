import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { UpsertAccountDto } from './dto/account.dto';
import { Account360Dto, CompanyStatsDto, PaginatedResult } from '@crm/shared-types';
import { Prisma } from '@crm/database';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a company with tenant isolation and automatically initialize account metadata
   */
  async create(organizationId: string, dto: CreateCompanyDto, userId?: string) {
    const ownerId = dto.ownerId || userId;

    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          organizationId,
          name: dto.name.trim(),
          domain: dto.domain ? dto.domain.trim().toLowerCase() : null,
          industry: dto.industry?.trim(),
          size: dto.size?.trim(),
          annualRevenue: dto.annualRevenue ? new Prisma.Decimal(dto.annualRevenue) : null,
          phone: dto.phone?.trim(),
          website: dto.website?.trim(),
          address: dto.address?.trim(),
          city: dto.city?.trim(),
          state: dto.state?.trim(),
          country: dto.country?.trim(),
          postalCode: dto.postalCode?.trim(),
          ownerId: ownerId ?? null,
        },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Auto-initialize Account record for Account 360 intelligence
      const account = await tx.account.create({
        data: {
          organizationId,
          companyId: company.id,
          customerStatus: 'ACTIVE',
          tier: 'STANDARD',
          healthScore: 100,
          mrr: new Prisma.Decimal(0),
          accountManagerId: ownerId ?? null,
        },
      });

      return { ...company, account };
    });
  }

  /**
   * Query companies with search, industry filter, pagination, and relation counts
   */
  async findAll(organizationId: string, query: CompanyQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      industry,
      size,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CompanyWhereInput = {
      organizationId,
      isArchived: false,
      ...(industry ? { industry } : {}),
      ...(size ? { size } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { domain: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { country: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const validSortFields = ['createdAt', 'name', 'annualRevenue', 'updatedAt'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [items, totalItems] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          account: true,
          contacts: {
            where: { isPrimary: true, isArchived: false },
            take: 1,
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
          _count: {
            select: {
              contacts: { where: { isArchived: false } },
              deals: { where: { isArchived: false } },
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
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
   * Find single company by ID
   */
  async findOne(organizationId: string, id: string) {
    const company = await this.prisma.company.findFirst({
      where: { id, organizationId, isArchived: false },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        account: {
          include: {
            accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        contacts: {
          where: { isArchived: false },
          orderBy: { isPrimary: 'desc' },
        },
        deals: {
          where: { isArchived: false },
          include: {
            stage: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    return company;
  }

  /**
   * Update company details
   */
  async update(organizationId: string, id: string, dto: UpdateCompanyDto) {
    const existing = await this.prisma.company.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!existing) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.domain !== undefined && { domain: dto.domain ? dto.domain.trim().toLowerCase() : null }),
        ...(dto.industry !== undefined && { industry: dto.industry?.trim() }),
        ...(dto.size !== undefined && { size: dto.size?.trim() }),
        ...(dto.annualRevenue !== undefined && {
          annualRevenue: dto.annualRevenue ? new Prisma.Decimal(dto.annualRevenue) : null,
        }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() }),
        ...(dto.website !== undefined && { website: dto.website?.trim() }),
        ...(dto.address !== undefined && { address: dto.address?.trim() }),
        ...(dto.city !== undefined && { city: dto.city?.trim() }),
        ...(dto.state !== undefined && { state: dto.state?.trim() }),
        ...(dto.country !== undefined && { country: dto.country?.trim() }),
        ...(dto.postalCode !== undefined && { postalCode: dto.postalCode?.trim() }),
        ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        account: true,
      },
    });

    return updated;
  }

  /**
   * Soft-delete / archive company
   */
  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.company.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!existing) {
      throw new NotFoundException(`Company with ID "${id}" not found`);
    }

    await this.prisma.company.update({
      where: { id },
      data: { isArchived: true },
    });

    return { success: true, message: `Company "${existing.name}" archived successfully` };
  }

  /**
   * Upsert Account intelligence metadata (Health Score, MRR, Tier, Contract dates)
   */
  async upsertAccount(organizationId: string, companyId: string, dto: UpsertAccountDto) {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, organizationId, isArchived: false },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    const account = await this.prisma.account.upsert({
      where: { companyId },
      update: {
        ...(dto.customerStatus !== undefined && { customerStatus: dto.customerStatus }),
        ...(dto.tier !== undefined && { tier: dto.tier }),
        ...(dto.accountManagerId !== undefined && { accountManagerId: dto.accountManagerId }),
        ...(dto.healthScore !== undefined && { healthScore: dto.healthScore }),
        ...(dto.mrr !== undefined && { mrr: new Prisma.Decimal(dto.mrr) }),
        ...(dto.contractStartDate !== undefined && {
          contractStartDate: dto.contractStartDate ? new Date(dto.contractStartDate) : null,
        }),
        ...(dto.contractEndDate !== undefined && {
          contractEndDate: dto.contractEndDate ? new Date(dto.contractEndDate) : null,
        }),
      },
      create: {
        organizationId,
        companyId,
        customerStatus: dto.customerStatus || 'ACTIVE',
        tier: dto.tier || 'STANDARD',
        accountManagerId: dto.accountManagerId ?? null,
        healthScore: dto.healthScore ?? 100,
        mrr: dto.mrr ? new Prisma.Decimal(dto.mrr) : new Prisma.Decimal(0),
        contractStartDate: dto.contractStartDate ? new Date(dto.contractStartDate) : null,
        contractEndDate: dto.contractEndDate ? new Date(dto.contractEndDate) : null,
      },
      include: {
        accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return account;
  }

  /**
   * Complete 360-degree aggregated Account Intelligence View
   */
  async getAccount360(organizationId: string, companyId: string): Promise<Account360Dto> {
    const company = await this.prisma.company.findFirst({
      where: { id: companyId, organizationId, isArchived: false },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        account: {
          include: {
            accountManager: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        contacts: {
          where: { isArchived: false },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            department: true,
            isPrimary: true,
          },
        },
        deals: {
          where: { isArchived: false },
          orderBy: { createdAt: 'desc' },
          include: {
            stage: { select: { id: true, name: true, color: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID "${companyId}" not found`);
    }

    // Calculate aggregated deals metrics
    let totalDealValue = 0;
    const dealItems = company.deals.map((d) => {
      const amount = Number(d.amount);
      totalDealValue += amount;
      return {
        id: d.id,
        title: d.title,
        amount,
        currency: d.currency,
        status: d.status as any,
        stage: d.stage,
        expectedCloseDate: d.expectedCloseDate,
      };
    });

    // Format account data
    const accountData = company.account
      ? {
          id: company.account.id,
          customerStatus: company.account.customerStatus,
          tier: company.account.tier,
          healthScore: company.account.healthScore,
          mrr: Number(company.account.mrr),
          contractStartDate: company.account.contractStartDate,
          contractEndDate: company.account.contractEndDate,
          accountManager: company.account.accountManager,
        }
      : null;

    return {
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
        size: company.size,
        annualRevenue: company.annualRevenue ? Number(company.annualRevenue) : null,
        phone: company.phone,
        website: company.website,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        postalCode: company.postalCode,
        createdAt: company.createdAt,
        owner: company.owner,
      },
      account: accountData,
      contacts: company.contacts,
      deals: {
        totalValue: totalDealValue,
        count: company.deals.length,
        items: dealItems,
      },
      activities: company.activities.map((a) => ({
        id: a.id,
        type: a.type as any,
        title: a.title,
        description: a.description,
        status: a.status as any,
        dueAt: a.dueAt,
        createdAt: a.createdAt,
        assignedTo: a.assignedTo,
      })),
    };
  }

  /**
   * Aggregate statistics for companies and accounts
   */
  async getStats(organizationId: string): Promise<CompanyStatsDto> {
    const [totalCompanies, accounts] = await Promise.all([
      this.prisma.company.count({ where: { organizationId, isArchived: false } }),
      this.prisma.account.findMany({
        where: { organizationId },
        select: { customerStatus: true, healthScore: true, mrr: true },
      }),
    ]);

    let activeAccounts = 0;
    let sumHealthScore = 0;
    let totalMrr = 0;

    for (const acc of accounts) {
      if (acc.customerStatus === 'ACTIVE') {
        activeAccounts++;
      }
      sumHealthScore += acc.healthScore;
      totalMrr += Number(acc.mrr);
    }

    const avgHealthScore = accounts.length > 0 ? Math.round(sumHealthScore / accounts.length) : 100;

    return {
      totalCompanies,
      totalAccounts: accounts.length,
      activeAccounts,
      avgHealthScore,
      totalMrr,
    };
  }
}
