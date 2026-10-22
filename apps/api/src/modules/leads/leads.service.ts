import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeduplicationService } from './deduplication.service';
import { CsvService } from './csv.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import {
  LeadStatus,
  LeadPriority,
  LeadSource,
  DealStatus,
  ActivityType,
  ActivityStatus,
  PaginatedResult,
  LeadStatsDto,
  LeadTimelineItem,
  ImportLeadsResult,
} from '@crm/shared-types';
import { Prisma } from '@crm/database';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly deduplicationService: DeduplicationService,
    private readonly csvService: CsvService,
  ) {}

  /**
   * Create a new Lead with tenant isolation & initial status history
   */
  async create(organizationId: string, dto: CreateLeadDto, userId?: string) {
    const ownerId = dto.ownerId || userId;
    const initialStatus = dto.status || LeadStatus.NEW;

    return this.prisma.$transaction(async (tx) => {
      const lead = await tx.lead.create({
        data: {
          organizationId,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          email: dto.email ? dto.email.trim().toLowerCase() : null,
          phone: dto.phone ? dto.phone.trim() : null,
          jobTitle: dto.jobTitle?.trim(),
          companyName: dto.companyName?.trim(),
          source: dto.source || LeadSource.WEBSITE,
          status: initialStatus,
          priority: dto.priority || LeadPriority.MEDIUM,
          score: dto.score ?? 0,
          estimatedValue: dto.estimatedValue ? new Prisma.Decimal(dto.estimatedValue) : null,
          currency: dto.currency || 'USD',
          ownerId: ownerId ?? null,
        },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Log initial status creation in LeadStatusHistory
      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: initialStatus,
          newStatus: initialStatus,
          changedById: userId ?? null,
          note: 'Lead captured into CRM pipeline',
        },
      });

      return lead;
    });
  }

  /**
   * Query leads with multi-field search, status/source filters, pagination, and sorting
   */
  async findAll(organizationId: string, query: LeadQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      priority,
      source,
      ownerId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.LeadWhereInput = {
      organizationId,
      isArchived: false,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(source ? { source } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const validSortFields = ['createdAt', 'updatedAt', 'score', 'estimatedValue', 'firstName', 'companyName'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [items, totalItems] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          statusHistory: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { id: true, newStatus: true, createdAt: true, note: true },
          },
          _count: {
            select: { activities: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
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
   * Fetch single lead by ID with complete relations
   */
  async findOne(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId, isArchived: false },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            amount: true,
            status: true,
            stage: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    return lead;
  }

  /**
   * Update lead properties and automatically track status transitions
   */
  async update(organizationId: string, id: string, dto: UpdateLeadDto, userId?: string) {
    const existing = await this.prisma.lead.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!existing) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    const statusChanged = dto.status && dto.status !== existing.status;

    return this.prisma.$transaction(async (tx) => {
      // Record status transition history if status changed
      if (statusChanged && dto.status) {
        await tx.leadStatusHistory.create({
          data: {
            leadId: id,
            oldStatus: existing.status,
            newStatus: dto.status,
            changedById: userId ?? null,
            note: dto.statusNote || `Status updated from ${existing.status} to ${dto.status}`,
          },
        });
      }

      const updated = await tx.lead.update({
        where: { id },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
          ...(dto.email !== undefined && { email: dto.email ? dto.email.trim().toLowerCase() : null }),
          ...(dto.phone !== undefined && { phone: dto.phone ? dto.phone.trim() : null }),
          ...(dto.jobTitle !== undefined && { jobTitle: dto.jobTitle?.trim() }),
          ...(dto.companyName !== undefined && { companyName: dto.companyName?.trim() }),
          ...(dto.source !== undefined && { source: dto.source }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.score !== undefined && { score: dto.score }),
          ...(dto.estimatedValue !== undefined && {
            estimatedValue: dto.estimatedValue ? new Prisma.Decimal(dto.estimatedValue) : null,
          }),
          ...(dto.currency !== undefined && { currency: dto.currency }),
          ...(dto.ownerId !== undefined && { ownerId: dto.ownerId }),
          ...(dto.lostReason !== undefined && { lostReason: dto.lostReason }),
        },
        include: {
          owner: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          statusHistory: {
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      return updated;
    });
  }

  /**
   * Soft-delete / archive a lead
   */
  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.lead.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!existing) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    await this.prisma.lead.update({
      where: { id },
      data: { isArchived: true },
    });

    return { success: true, message: `Lead "${existing.firstName} ${existing.lastName}" archived successfully` };
  }

  /**
   * Atomic Lead-to-Deal Conversion in a single ACID transaction
   */
  async convertLead(organizationId: string, id: string, dto: ConvertLeadDto, userId?: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${id}" not found`);
    }

    if (lead.status === LeadStatus.CONVERTED) {
      throw new BadRequestException('Lead has already been converted');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Resolve or Create Company
      let company: any = null;
      if (lead.companyName) {
        company = await tx.company.findFirst({
          where: {
            organizationId,
            name: { equals: lead.companyName.trim(), mode: 'insensitive' },
            isArchived: false,
          },
        });

        if (!company) {
          company = await tx.company.create({
            data: {
              organizationId,
              name: lead.companyName.trim(),
              phone: lead.phone,
              ownerId: lead.ownerId || userId,
            },
          });
        }
      }

      // 2. Resolve or Create Contact
      let contact: any = null;
      if (lead.email) {
        contact = await tx.contact.findFirst({
          where: {
            organizationId,
            email: { equals: lead.email.trim().toLowerCase(), mode: 'insensitive' },
            isArchived: false,
          },
        });
      }

      if (!contact) {
        contact = await tx.contact.create({
          data: {
            organizationId,
            companyId: company?.id ?? null,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email || `${lead.firstName.toLowerCase()}.${lead.lastName.toLowerCase()}@noemail.local`,
            phone: lead.phone,
            jobTitle: lead.jobTitle,
            isPrimary: true,
          },
        });
      }

      // 3. Resolve Pipeline and Stage if Deal creation requested
      let deal: any = null;
      const shouldCreateDeal = dto.createDeal !== false;

      if (shouldCreateDeal) {
        let pipeline: any = null;
        if (dto.pipelineId) {
          pipeline = await tx.pipeline.findFirst({
            where: { id: dto.pipelineId, organizationId },
            include: { stages: { orderBy: { order: 'asc' } } },
          });
        }

        if (!pipeline) {
          pipeline = await tx.pipeline.findFirst({
            where: { organizationId, isDefault: true },
            include: { stages: { orderBy: { order: 'asc' } } },
          });
        }

        if (!pipeline) {
          pipeline = await tx.pipeline.findFirst({
            where: { organizationId },
            include: { stages: { orderBy: { order: 'asc' } } },
          });
        }

        // Auto-provision pipeline if tenant does not have one
        if (!pipeline) {
          pipeline = await tx.pipeline.create({
            data: {
              organizationId,
              name: 'Standard Sales Pipeline',
              isDefault: true,
              stages: {
                create: [
                  { name: 'Discovery / Qualification', order: 1, winProbability: 20, color: '#3B82F6' },
                  { name: 'Proposal Sent', order: 2, winProbability: 50, color: '#F59E0B' },
                  { name: 'Negotiation', order: 3, winProbability: 80, color: '#8B5CF6' },
                  { name: 'Closed Won', order: 4, winProbability: 100, color: '#10B981' },
                ],
              },
            },
            include: { stages: { orderBy: { order: 'asc' } } },
          });
        }

        let stage: any = null;
        if (dto.stageId) {
          stage = pipeline.stages.find((s: any) => s.id === dto.stageId);
        }
        if (!stage) {
          stage = pipeline.stages[0];
        }

        const dealTitle =
          dto.dealTitle ||
          (lead.companyName
            ? `${lead.companyName} - New Opportunity`
            : `${lead.firstName} ${lead.lastName} - Opportunity`);

        const dealAmount =
          dto.dealAmount !== undefined
            ? dto.dealAmount
            : lead.estimatedValue
            ? Number(lead.estimatedValue)
            : 0;

        deal = await tx.deal.create({
          data: {
            organizationId,
            title: dealTitle,
            amount: new Prisma.Decimal(dealAmount),
            currency: lead.currency || 'USD',
            status: DealStatus.OPEN,
            pipelineId: pipeline.id,
            stageId: stage.id,
            companyId: company?.id ?? null,
            contactId: contact.id,
            leadId: lead.id,
            ownerId: lead.ownerId || userId,
            expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
          },
        });
      }

      // 4. Update Lead to CONVERTED
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.CONVERTED,
          convertedAt: new Date(),
          convertedCompanyId: company?.id ?? null,
          convertedContactId: contact.id,
          convertedDealId: deal?.id ?? null,
        },
      });

      // 5. Record Status Transition History
      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: lead.status,
          newStatus: LeadStatus.CONVERTED,
          changedById: userId ?? null,
          note: `Converted into Contact (${contact.firstName} ${contact.lastName})${
            company ? ` and Company (${company.name})` : ''
          }${deal ? ` and Deal (${deal.title})` : ''}`,
        },
      });

      // 6. Record System Activity Note
      if (userId) {
        await tx.activity.create({
          data: {
            organizationId,
            type: ActivityType.NOTE,
            title: 'Lead Converted',
            description: `Lead converted to Contact ${contact.firstName} ${contact.lastName}${
              deal ? ` with Deal "${deal.title}" ($${deal.amount})` : ''
            }`,
            status: ActivityStatus.COMPLETED,
            createdById: userId,
            leadId: lead.id,
            contactId: contact.id,
            companyId: company?.id ?? null,
            dealId: deal?.id ?? null,
          },
        });
      }

      return {
        success: true,
        message: 'Lead converted successfully',
        lead: updatedLead,
        contact,
        company,
        deal,
      };
    });
  }

  /**
   * Append a note / conversation log to lead timeline
   */
  async addNote(organizationId: string, leadId: string, noteText: string, userId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, organizationId, isArchived: false },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${leadId}" not found`);
    }

    const activity = await this.prisma.activity.create({
      data: {
        organizationId,
        leadId,
        type: ActivityType.NOTE,
        title: 'Lead Note',
        description: noteText,
        status: ActivityStatus.COMPLETED,
        createdById: userId,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    return activity;
  }

  /**
   * Fetch unified chronological timeline for lead (status changes + activities)
   */
  async getTimeline(organizationId: string, leadId: string): Promise<LeadTimelineItem[]> {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, organizationId, isArchived: false },
      include: {
        statusHistory: {
          include: {
            changedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException(`Lead with ID "${leadId}" not found`);
    }

    const timeline: LeadTimelineItem[] = [];

    // Map status history
    for (const sh of lead.statusHistory) {
      timeline.push({
        id: sh.id,
        type: 'STATUS_CHANGE',
        title: `Status changed to ${sh.newStatus}`,
        description: sh.note,
        oldStatus: sh.oldStatus as LeadStatus,
        newStatus: sh.newStatus as LeadStatus,
        performedBy: sh.changedBy
          ? {
              id: sh.changedBy.id,
              name: `${sh.changedBy.firstName} ${sh.changedBy.lastName}`,
              email: sh.changedBy.email,
            }
          : null,
        timestamp: sh.createdAt,
      });
    }

    // Map activities & notes
    for (const act of lead.activities) {
      timeline.push({
        id: act.id,
        type: 'ACTIVITY',
        title: act.title,
        description: act.description,
        timestamp: act.createdAt,
        metadata: {
          activityType: act.type,
          activityStatus: act.status,
          outcome: act.outcome,
        },
      });
    }

    // Add Lead Creation entry
    timeline.push({
      id: `lead-create-${lead.id}`,
      type: 'CREATION',
      title: 'Lead Created',
      description: `Lead originally captured via ${lead.source}`,
      timestamp: lead.createdAt,
    });

    // Sort chronologically descending
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return timeline;
  }

  /**
   * Compute comprehensive Lead statistics for reporting dashboard
   */
  async getStats(organizationId: string): Promise<LeadStatsDto> {
    const [counts, sumValueResult] = await Promise.all([
      this.prisma.lead.groupBy({
        by: ['status'],
        where: { organizationId, isArchived: false },
        _count: { status: true },
      }),
      this.prisma.lead.aggregate({
        where: { organizationId, isArchived: false },
        _sum: { estimatedValue: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    let totalLeads = 0;

    for (const item of counts) {
      statusMap[item.status] = item._count.status;
      totalLeads += item._count.status;
    }

    const newLeads = statusMap[LeadStatus.NEW] || 0;
    const contactedLeads = statusMap[LeadStatus.CONTACTED] || 0;
    const qualifiedLeads = statusMap[LeadStatus.QUALIFIED] || 0;
    const unqualifiedLeads = statusMap[LeadStatus.UNQUALIFIED] || 0;
    const convertedLeads = statusMap[LeadStatus.CONVERTED] || 0;
    const lostLeads = statusMap[LeadStatus.LOST] || 0;

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10 : 0;
    const totalEstimatedValue = sumValueResult._sum.estimatedValue
      ? Number(sumValueResult._sum.estimatedValue)
      : 0;

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      unqualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      totalEstimatedValue,
    };
  }

  /**
   * Bulk import leads with deduplication handling
   */
  async importLeads(
    organizationId: string,
    leads: CreateLeadDto[],
    onDuplicate: 'SKIP' | 'UPDATE' | 'IMPORT_ANYWAY' = 'SKIP',
    userId?: string,
  ): Promise<ImportLeadsResult> {
    let imported = 0;
    let updated = 0;
    let skippedDuplicates = 0;
    let failed = 0;
    const errors: Array<{ row: number; reason: string; data?: Record<string, unknown> }> = [];

    for (let i = 0; i < leads.length; i++) {
      const rowNumber = i + 1;
      const leadData = leads[i];

      try {
        if (!leadData.firstName || !leadData.lastName) {
          failed++;
          errors.push({
            row: rowNumber,
            reason: 'Missing firstName or lastName',
            data: leadData as any,
          });
          continue;
        }

        // Deduplication Check
        const dupCheck = await this.deduplicationService.checkDuplicate(organizationId, {
          email: leadData.email,
          phone: leadData.phone,
          companyName: leadData.companyName,
        });

        if (dupCheck.hasDuplicate) {
          const topMatch = dupCheck.matches[0];

          if (onDuplicate === 'SKIP') {
            skippedDuplicates++;
            continue;
          } else if (onDuplicate === 'UPDATE' && topMatch) {
            await this.update(organizationId, topMatch.leadId, leadData, userId);
            updated++;
            continue;
          }
        }

        // Create new lead
        await this.create(organizationId, leadData, userId);
        imported++;
      } catch (err) {
        failed++;
        errors.push({
          row: rowNumber,
          reason: (err as Error).message,
          data: leadData as any,
        });
      }
    }

    return {
      totalRows: leads.length,
      imported,
      updated,
      skippedDuplicates,
      failed,
      errors,
    };
  }

  /**
   * Export tenant leads matching filters to standard CSV format
   */
  async exportLeads(organizationId: string, query: LeadQueryDto): Promise<string> {
    const { search, status, priority, source, ownerId } = query;

    const where: Prisma.LeadWhereInput = {
      organizationId,
      isArchived: false,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(source ? { source } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { companyName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { firstName: true, lastName: true } },
      },
    });

    return this.csvService.generateLeadCsv(leads);
  }
}
