import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { ChangeDealStageDto } from './dto/change-deal-stage.dto';
import { DealQueryDto } from './dto/deal-query.dto';
import { DealStatus, EntityType, PipelineForecastSummaryDto, DealForecastStageBreakdown } from '@crm/shared-types';
import { Prisma } from '@crm/database';

@Injectable()
export class DealsService {
  private readonly logger = new Logger(DealsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly customFieldsService: CustomFieldsService,
  ) {}

  /**
   * Create a new deal with pipeline/stage verification and custom fields
   */
  async create(organizationId: string, dto: CreateDealDto, currentUserId?: string) {
    // 1. Verify pipeline belongs to tenant
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: dto.pipelineId, organizationId },
      include: { stages: true },
    });

    if (!pipeline) {
      throw new BadRequestException(`Pipeline with ID "${dto.pipelineId}" not found for this organization`);
    }

    // 2. Verify stage belongs to pipeline
    const stage = pipeline.stages.find((s) => s.id === dto.stageId);
    if (!stage) {
      throw new BadRequestException(`Stage with ID "${dto.stageId}" does not belong to pipeline "${pipeline.name}"`);
    }

    // 3. Verify company if provided
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: dto.companyId, organizationId, isArchived: false },
      });
      if (!company) {
        throw new BadRequestException(`Company with ID "${dto.companyId}" not found`);
      }
    }

    // 4. Verify contact if provided
    if (dto.contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: dto.contactId, organizationId, isArchived: false },
      });
      if (!contact) {
        throw new BadRequestException(`Contact with ID "${dto.contactId}" not found`);
      }
    }

    // 5. Determine initial status based on stage win probability or name
    let status: DealStatus = DealStatus.OPEN;
    let actualCloseDate: Date | null = null;
    let lostReason: string | null = null;

    if (stage.winProbability === 100 || stage.name.toLowerCase().includes('won')) {
      status = DealStatus.WON;
      actualCloseDate = new Date();
    } else if (stage.winProbability === 0 || stage.name.toLowerCase().includes('lost')) {
      status = DealStatus.LOST;
      actualCloseDate = new Date();
      lostReason = 'Initial stage set to Lost';
    }

    const ownerId = dto.ownerId || currentUserId || null;

    return this.prisma.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          organizationId,
          title: dto.title.trim(),
          amount: new Prisma.Decimal(dto.amount),
          currency: dto.currency || 'USD',
          status,
          pipelineId: dto.pipelineId,
          stageId: dto.stageId,
          companyId: dto.companyId || null,
          contactId: dto.contactId || null,
          leadId: dto.leadId || null,
          ownerId,
          expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
          actualCloseDate,
          lostReason,
        },
        include: {
          stage: true,
          pipeline: true,
          company: { select: { id: true, name: true, domain: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // 6. Handle custom fields if provided
      if (dto.customFields && Object.keys(dto.customFields).length > 0) {
        await this.customFieldsService.setValues(
          organizationId,
          EntityType.DEAL,
          deal.id,
          dto.customFields,
        );
      }

      const customFields = await this.customFieldsService.getValues(
        organizationId,
        EntityType.DEAL,
        deal.id,
      );

      return {
        ...deal,
        amount: Number(deal.amount),
        customFields,
      };
    });
  }

  /**
   * Find deals with filtering, search, and pagination
   */
  async findAll(organizationId: string, query: DealQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      pipelineId,
      stageId,
      status,
      ownerId,
      companyId,
      contactId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.DealWhereInput = {
      organizationId,
      isArchived: false,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
      ...(status && { status }),
      ...(ownerId && { ownerId }),
      ...(companyId && { companyId }),
      ...(contactId && { contactId }),
    };

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { company: { name: { contains: term, mode: 'insensitive' } } },
        { contact: { firstName: { contains: term, mode: 'insensitive' } } },
        { contact: { lastName: { contains: term, mode: 'insensitive' } } },
        { contact: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    const [totalItems, deals] = await Promise.all([
      this.prisma.deal.count({ where }),
      this.prisma.deal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          stage: {
            select: { id: true, name: true, order: true, winProbability: true, color: true },
          },
          pipeline: { select: { id: true, name: true } },
          company: { select: { id: true, name: true, domain: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    const items = deals.map((d) => ({
      ...d,
      amount: Number(d.amount),
    }));

    const totalPages = Math.ceil(totalItems / limit);

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
   * Find single deal by ID with relations and custom fields
   */
  async findOne(organizationId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId, isArchived: false },
      include: {
        stage: true,
        pipeline: {
          include: {
            stages: { orderBy: { order: 'asc' } },
          },
        },
        company: {
          select: { id: true, name: true, domain: true, industry: true, phone: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true, jobTitle: true },
        },
        owner: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    const customFields = await this.customFieldsService.getValues(
      organizationId,
      EntityType.DEAL,
      id,
    );

    return {
      ...deal,
      amount: Number(deal.amount),
      customFields,
    };
  }

  /**
   * Update deal details
   */
  async update(organizationId: string, id: string, dto: UpdateDealDto) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId, isArchived: false },
      include: { stage: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    // Stage validation if stage changed
    let stage = deal.stage;
    if (dto.stageId && dto.stageId !== deal.stageId) {
      const targetPipelineId = dto.pipelineId || deal.pipelineId;
      const targetStage = await this.prisma.stage.findFirst({
        where: { id: dto.stageId, pipeline: { organizationId, id: targetPipelineId } },
      });

      if (!targetStage) {
        throw new BadRequestException(`Target stage "${dto.stageId}" is invalid for this pipeline`);
      }
      stage = targetStage as any;
    }

    // Status transition logic
    let status = dto.status !== undefined ? dto.status : deal.status;
    let actualCloseDate = deal.actualCloseDate;
    let lostReason = dto.lostReason !== undefined ? dto.lostReason : deal.lostReason;

    if (dto.status === DealStatus.WON) {
      actualCloseDate = new Date();
      lostReason = null;
    } else if (dto.status === DealStatus.LOST) {
      actualCloseDate = new Date();
      lostReason = dto.lostReason || deal.lostReason || 'Closed Lost';
    } else if (dto.status === DealStatus.OPEN && deal.status !== DealStatus.OPEN) {
      actualCloseDate = null;
      lostReason = null;
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deal.update({
        where: { id },
        data: {
          ...(dto.title && { title: dto.title.trim() }),
          ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
          ...(dto.currency && { currency: dto.currency }),
          ...(dto.pipelineId && { pipelineId: dto.pipelineId }),
          ...(dto.stageId && { stageId: dto.stageId }),
          ...(dto.companyId !== undefined && { companyId: dto.companyId || null }),
          ...(dto.contactId !== undefined && { contactId: dto.contactId || null }),
          ...(dto.ownerId !== undefined && { ownerId: dto.ownerId || null }),
          ...(dto.expectedCloseDate !== undefined && {
            expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
          }),
          status,
          actualCloseDate,
          lostReason,
        },
        include: {
          stage: true,
          pipeline: true,
          company: { select: { id: true, name: true, domain: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      if (dto.customFields && Object.keys(dto.customFields).length > 0) {
        await this.customFieldsService.setValues(
          organizationId,
          EntityType.DEAL,
          id,
          dto.customFields,
        );
      }

      const customFields = await this.customFieldsService.getValues(
        organizationId,
        EntityType.DEAL,
        id,
      );

      return {
        ...updated,
        amount: Number(updated.amount),
        customFields,
      };
    });
  }

  /**
   * Atomic stage & status movement for Kanban board drag-and-drop
   */
  async changeStage(organizationId: string, id: string, dto: ChangeDealStageDto) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId, isArchived: false },
      include: { stage: true },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    const targetStage = await this.prisma.stage.findFirst({
      where: {
        id: dto.stageId,
        pipeline: { organizationId },
      },
      include: { pipeline: true },
    });

    if (!targetStage) {
      throw new BadRequestException(`Target stage with ID "${dto.stageId}" not found for this organization`);
    }

    let status = dto.status;
    let actualCloseDate: Date | null = deal.actualCloseDate;
    let lostReason: string | null = dto.lostReason ?? deal.lostReason;

    // Automatic transition inference if not explicitly provided
    if (!status) {
      if (targetStage.winProbability === 100 || targetStage.name.toLowerCase().includes('won')) {
        status = DealStatus.WON;
        actualCloseDate = new Date();
        lostReason = null;
      } else if (targetStage.winProbability === 0 || targetStage.name.toLowerCase().includes('lost')) {
        status = DealStatus.LOST;
        actualCloseDate = new Date();
        lostReason = dto.lostReason || 'Stage moved to Lost';
      } else {
        status = DealStatus.OPEN;
        actualCloseDate = null;
        lostReason = null;
      }
    } else {
      if (status === DealStatus.WON) {
        actualCloseDate = new Date();
        lostReason = null;
      } else if (status === DealStatus.LOST) {
        actualCloseDate = new Date();
        lostReason = dto.lostReason || deal.lostReason || 'Stage moved to Lost';
      } else if (status === DealStatus.OPEN) {
        actualCloseDate = null;
        lostReason = null;
      }
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        stageId: targetStage.id,
        pipelineId: targetStage.pipelineId,
        status,
        actualCloseDate,
        lostReason,
      },
      include: {
        stage: true,
        pipeline: true,
        company: { select: { id: true, name: true, domain: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return {
      ...updated,
      amount: Number(updated.amount),
    };
  }

  /**
   * Soft delete (archive) deal
   */
  async delete(organizationId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, organizationId, isArchived: false },
    });

    if (!deal) {
      throw new NotFoundException(`Deal with ID "${id}" not found`);
    }

    await this.prisma.deal.update({
      where: { id },
      data: { isArchived: true },
    });

    return { success: true, message: `Deal "${deal.title}" archived successfully` };
  }

  /**
   * Calculate weighted revenue forecast and pipeline metrics
   */
  async getForecast(organizationId: string, pipelineId?: string): Promise<PipelineForecastSummaryDto> {
    let targetPipelineId = pipelineId;

    if (!targetPipelineId) {
      const defaultPipeline = await this.prisma.pipeline.findFirst({
        where: { organizationId, isDefault: true },
      });
      if (defaultPipeline) {
        targetPipelineId = defaultPipeline.id;
      } else {
        const anyPipeline = await this.prisma.pipeline.findFirst({
          where: { organizationId },
        });
        targetPipelineId = anyPipeline?.id;
      }
    }

    if (!targetPipelineId) {
      return {
        totalDeals: 0,
        totalPipelineValue: 0,
        weightedForecastValue: 0,
        wonDealsCount: 0,
        wonDealsValue: 0,
        lostDealsCount: 0,
        lostDealsValue: 0,
        openDealsCount: 0,
        winRate: 0,
        averageDealSize: 0,
        stageBreakdown: [],
      };
    }

    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: targetPipelineId, organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${targetPipelineId}" not found`);
    }

    const deals = await this.prisma.deal.findMany({
      where: {
        organizationId,
        pipelineId: targetPipelineId,
        isArchived: false,
      },
      select: {
        id: true,
        stageId: true,
        amount: true,
        status: true,
      },
    });

    const totalDeals = deals.length;
    let totalPipelineValue = 0;
    let wonDealsCount = 0;
    let wonDealsValue = 0;
    let lostDealsCount = 0;
    let lostDealsValue = 0;
    let openDealsCount = 0;

    const stageMap = new Map<string, { dealCount: number; totalAmount: number }>();
    for (const stage of pipeline.stages) {
      stageMap.set(stage.id, { dealCount: 0, totalAmount: 0 });
    }

    for (const deal of deals) {
      const amt = Number(deal.amount);

      if (deal.status === DealStatus.WON) {
        wonDealsCount++;
        wonDealsValue += amt;
      } else if (deal.status === DealStatus.LOST) {
        lostDealsCount++;
        lostDealsValue += amt;
      } else {
        // OPEN deals contribute to active pipeline value
        openDealsCount++;
        totalPipelineValue += amt;
      }

      const stgData = stageMap.get(deal.stageId);
      if (stgData) {
        stgData.dealCount++;
        stgData.totalAmount += amt;
      }
    }

    let weightedForecastValue = 0;
    const stageBreakdown: DealForecastStageBreakdown[] = pipeline.stages.map((stage) => {
      const data = stageMap.get(stage.id) || { dealCount: 0, totalAmount: 0 };
      const weightedAmount = Number(((data.totalAmount * stage.winProbability) / 100).toFixed(2));
      
      // Open / in-progress stages contribute to weighted forecast
      weightedForecastValue += weightedAmount;

      return {
        id: stage.id,
        name: stage.name,
        order: stage.order,
        winProbability: stage.winProbability,
        color: stage.color,
        dealCount: data.dealCount,
        totalAmount: data.totalAmount,
        weightedAmount,
      };
    });

    const closedCount = wonDealsCount + lostDealsCount;
    const winRate = closedCount > 0 ? Number(((wonDealsCount / closedCount) * 100).toFixed(1)) : 0;
    const totalAllAmount = deals.reduce((acc, d) => acc + Number(d.amount), 0);
    const averageDealSize = totalDeals > 0 ? Number((totalAllAmount / totalDeals).toFixed(2)) : 0;

    return {
      totalDeals,
      totalPipelineValue,
      weightedForecastValue: Number(weightedForecastValue.toFixed(2)),
      wonDealsCount,
      wonDealsValue,
      lostDealsCount,
      lostDealsValue,
      openDealsCount,
      winRate,
      averageDealSize,
      stageBreakdown,
    };
  }
}
