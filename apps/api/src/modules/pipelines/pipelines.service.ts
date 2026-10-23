import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePipelineDto } from './dto/create-pipeline.dto';
import { UpdatePipelineDto } from './dto/update-pipeline.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { UpdateStageDto } from './dto/update-stage.dto';
import { ReorderStagesDto } from './dto/reorder-stages.dto';

@Injectable()
export class PipelinesService {
  private readonly logger = new Logger(PipelinesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all pipelines with stages and aggregate deal metrics for the organization
   */
  async findAll(organizationId: string) {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { deals: { where: { isArchived: false } } },
            },
          },
        },
        _count: {
          select: { deals: { where: { isArchived: false } } },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    // If no pipelines exist yet for this tenant, auto-provision default pipeline
    if (pipelines.length === 0) {
      await this.ensureDefaultPipeline(organizationId);
      return this.findAll(organizationId);
    }

    // Enrich with deal volume amounts per stage and pipeline
    const pipelineIds = pipelines.map((p) => p.id);
    const deals = await this.prisma.deal.findMany({
      where: {
        organizationId,
        pipelineId: { in: pipelineIds },
        isArchived: false,
      },
      select: {
        pipelineId: true,
        stageId: true,
        amount: true,
      },
    });

    const pipelineAmountMap = new Map<string, number>();
    const stageAmountMap = new Map<string, number>();

    for (const deal of deals) {
      const amt = Number(deal.amount);
      pipelineAmountMap.set(deal.pipelineId, (pipelineAmountMap.get(deal.pipelineId) || 0) + amt);
      stageAmountMap.set(deal.stageId, (stageAmountMap.get(deal.stageId) || 0) + amt);
    }

    return pipelines.map((p) => ({
      ...p,
      dealCount: p._count.deals,
      totalDealValue: pipelineAmountMap.get(p.id) || 0,
      stages: p.stages.map((s) => ({
        ...s,
        dealCount: s._count.deals,
        totalDealValue: stageAmountMap.get(s.id) || 0,
      })),
    }));
  }

  /**
   * Find a single pipeline by ID with stages and deal stats
   */
  async findOne(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { deals: { where: { isArchived: false } } },
            },
          },
        },
        _count: {
          select: { deals: { where: { isArchived: false } } },
        },
      },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${id}" not found`);
    }

    const deals = await this.prisma.deal.findMany({
      where: {
        organizationId,
        pipelineId: id,
        isArchived: false,
      },
      select: {
        stageId: true,
        amount: true,
      },
    });

    let totalValue = 0;
    const stageAmountMap = new Map<string, number>();

    for (const deal of deals) {
      const amt = Number(deal.amount);
      totalValue += amt;
      stageAmountMap.set(deal.stageId, (stageAmountMap.get(deal.stageId) || 0) + amt);
    }

    return {
      ...pipeline,
      dealCount: pipeline._count.deals,
      totalDealValue: totalValue,
      stages: pipeline.stages.map((s) => ({
        ...s,
        dealCount: s._count.deals,
        totalDealValue: stageAmountMap.get(s.id) || 0,
      })),
    };
  }

  /**
   * Create a new sales pipeline with stages
   */
  async create(organizationId: string, dto: CreatePipelineDto) {
    const existing = await this.prisma.pipeline.findFirst({
      where: {
        organizationId,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new BadRequestException(`Pipeline with name "${dto.name.trim()}" already exists`);
    }

    const existingCount = await this.prisma.pipeline.count({ where: { organizationId } });
    const isDefault = dto.isDefault ?? existingCount === 0;

    const defaultStages = [
      { name: 'Discovery / Qualification', order: 1, winProbability: 20, color: '#3B82F6' },
      { name: 'Proposal Sent', order: 2, winProbability: 50, color: '#F59E0B' },
      { name: 'Negotiation', order: 3, winProbability: 80, color: '#8B5CF6' },
      { name: 'Closed Won', order: 4, winProbability: 100, color: '#10B981' },
      { name: 'Closed Lost', order: 5, winProbability: 0, color: '#EF4444' },
    ];

    const stagesToCreate = dto.stages && dto.stages.length > 0
      ? dto.stages.map((s, index) => ({
          name: s.name.trim(),
          order: s.order ?? index + 1,
          winProbability: s.winProbability ?? 10,
          color: s.color ?? '#3B82F6',
        }))
      : defaultStages;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.pipeline.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.pipeline.create({
        data: {
          organizationId,
          name: dto.name.trim(),
          isDefault,
          stages: {
            create: stagesToCreate,
          },
        },
        include: {
          stages: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Update pipeline details
   */
  async update(organizationId: string, id: string, dto: UpdatePipelineDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${id}" not found`);
    }

    if (dto.name && dto.name.trim() !== pipeline.name) {
      const duplicate = await this.prisma.pipeline.findFirst({
        where: {
          organizationId,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(`Pipeline with name "${dto.name.trim()}" already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.pipeline.updateMany({
          where: { organizationId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      return tx.pipeline.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name.trim() }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
        include: {
          stages: {
            orderBy: { order: 'asc' },
          },
        },
      });
    });
  }

  /**
   * Delete a pipeline
   */
  async delete(organizationId: string, id: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${id}" not found`);
    }

    if (pipeline.isDefault) {
      throw new BadRequestException('Cannot delete the default pipeline. Please set another pipeline as default first.');
    }

    const activeDealsCount = await this.prisma.deal.count({
      where: { pipelineId: id, isArchived: false },
    });

    if (activeDealsCount > 0) {
      throw new BadRequestException(
        `Cannot delete pipeline with ${activeDealsCount} active deal(s). Move deals to another pipeline first.`,
      );
    }

    await this.prisma.pipeline.delete({ where: { id } });

    return { success: true, message: `Pipeline "${pipeline.name}" deleted successfully` };
  }

  /**
   * Create a new stage in a pipeline
   */
  async createStage(organizationId: string, pipelineId: string, dto: CreateStageDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
      include: { stages: { orderBy: { order: 'desc' }, take: 1 } },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${pipelineId}" not found`);
    }

    const maxOrder = pipeline.stages[0]?.order ?? 0;
    const order = dto.order ?? maxOrder + 1;

    return this.prisma.stage.create({
      data: {
        pipelineId,
        name: dto.name.trim(),
        order,
        winProbability: dto.winProbability ?? 10,
        color: dto.color ?? '#3B82F6',
      },
    });
  }

  /**
   * Update stage properties
   */
  async updateStage(
    organizationId: string,
    pipelineId: string,
    stageId: string,
    dto: UpdateStageDto,
  ) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${pipelineId}" not found`);
    }

    const stage = await this.prisma.stage.findFirst({
      where: { id: stageId, pipelineId },
    });

    if (!stage) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found in this pipeline`);
    }

    return this.prisma.stage.update({
      where: { id: stageId },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.winProbability !== undefined && { winProbability: dto.winProbability }),
        ...(dto.color && { color: dto.color }),
      },
    });
  }

  /**
   * Delete stage if no deals are currently attached to it
   */
  async deleteStage(organizationId: string, pipelineId: string, stageId: string) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
      include: { stages: true },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${pipelineId}" not found`);
    }

    if (pipeline.stages.length <= 1) {
      throw new BadRequestException('A pipeline must have at least one stage.');
    }

    const stage = pipeline.stages.find((s) => s.id === stageId);
    if (!stage) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found in this pipeline`);
    }

    const dealsCount = await this.prisma.deal.count({
      where: { stageId, isArchived: false },
    });

    if (dealsCount > 0) {
      throw new BadRequestException(
        `Cannot delete stage containing ${dealsCount} deal(s). Please move the deals to another stage first.`,
      );
    }

    await this.prisma.stage.delete({ where: { id: stageId } });

    return { success: true, message: `Stage "${stage.name}" successfully deleted` };
  }

  /**
   * Batch reorder stages in pipeline
   */
  async reorderStages(organizationId: string, pipelineId: string, dto: ReorderStagesDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId },
    });

    if (!pipeline) {
      throw new NotFoundException(`Pipeline with ID "${pipelineId}" not found`);
    }

    await this.prisma.$transaction(
      dto.stageOrders.map((item) =>
        this.prisma.stage.updateMany({
          where: { id: item.id, pipelineId },
          data: { order: item.order },
        }),
      ),
    );

    return this.prisma.stage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
    });
  }

  /**
   * Helper to ensure organization has at least one default pipeline
   */
  async ensureDefaultPipeline(organizationId: string) {
    const existing = await this.prisma.pipeline.findFirst({
      where: { organizationId, isDefault: true },
      include: { stages: { orderBy: { order: 'asc' } } },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.pipeline.create({
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
            { name: 'Closed Lost', order: 5, winProbability: 0, color: '#EF4444' },
          ],
        },
      },
      include: {
        stages: { orderBy: { order: 'asc' } },
      },
    });
  }
}
