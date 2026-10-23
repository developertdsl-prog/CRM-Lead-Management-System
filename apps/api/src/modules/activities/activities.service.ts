import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityQueryDto } from './dto/activity-query.dto';
import { ActivityStatus, ActivityPriority, ActivityType } from '@crm/shared-types';
import { Prisma } from '@crm/database';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an activity with entity links
   */
  async create(organizationId: string, dto: CreateActivityDto, currentUserId: string) {
    const isCompleted = dto.status === ActivityStatus.COMPLETED;

    return this.prisma.activity.create({
      data: {
        organizationId,
        type: dto.type,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        status: dto.status || ActivityStatus.PENDING,
        priority: dto.priority || ActivityPriority.MEDIUM,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        completedAt: isCompleted ? new Date() : null,
        durationMinutes: dto.durationMinutes || null,
        outcome: dto.outcome || null,
        callType: dto.callType || null,
        meetingUrl: dto.meetingUrl || null,
        location: dto.location || null,
        assignedToId: dto.assignedToId || currentUserId,
        createdById: currentUserId,
        leadId: dto.leadId || null,
        contactId: dto.contactId || null,
        companyId: dto.companyId || null,
        dealId: dto.dealId || null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, amount: true } },
      },
    });
  }

  /**
   * List activities with search, multi-filters, and overdue filtering
   */
  async findAll(organizationId: string, query: ActivityQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      type,
      status,
      priority,
      assignedToId,
      leadId,
      contactId,
      companyId,
      dealId,
      isOverdue,
      sortBy = 'dueAt',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ActivityWhereInput = {
      organizationId,
      ...(type && { type }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(assignedToId && { assignedToId }),
      ...(leadId && { leadId }),
      ...(contactId && { contactId }),
      ...(companyId && { companyId }),
      ...(dealId && { dealId }),
    };

    if (isOverdue) {
      where.dueAt = { lt: new Date() };
      where.status = { in: [ActivityStatus.PENDING, ActivityStatus.IN_PROGRESS] };
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [totalItems, activities] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true, amount: true } },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: activities,
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
   * Find single activity by ID
   */
  async findOne(organizationId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, amount: true } },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    return activity;
  }

  /**
   * Update activity
   */
  async update(organizationId: string, id: string, dto: UpdateActivityDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    let completedAt = activity.completedAt;
    if (dto.status === ActivityStatus.COMPLETED && activity.status !== ActivityStatus.COMPLETED) {
      completedAt = new Date();
    } else if (dto.status && dto.status !== ActivityStatus.COMPLETED) {
      completedAt = null;
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...(dto.type && { type: dto.type }),
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.dueAt !== undefined && { dueAt: dto.dueAt ? new Date(dto.dueAt) : null }),
        ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
        ...(dto.outcome !== undefined && { outcome: dto.outcome }),
        ...(dto.callType !== undefined && { callType: dto.callType }),
        ...(dto.meetingUrl !== undefined && { meetingUrl: dto.meetingUrl }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.assignedToId !== undefined && { assignedToId: dto.assignedToId }),
        ...(dto.leadId !== undefined && { leadId: dto.leadId }),
        ...(dto.contactId !== undefined && { contactId: dto.contactId }),
        ...(dto.companyId !== undefined && { companyId: dto.companyId }),
        ...(dto.dealId !== undefined && { dealId: dto.dealId }),
        completedAt,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, amount: true } },
      },
    });
  }

  /**
   * Quick action: mark activity as completed
   */
  async markComplete(organizationId: string, id: string, outcome?: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    return this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.COMPLETED,
        completedAt: new Date(),
        ...(outcome && { outcome }),
      },
    });
  }

  /**
   * Delete activity
   */
  async delete(organizationId: string, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, organizationId },
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID "${id}" not found`);
    }

    await this.prisma.activity.delete({ where: { id } });

    return { success: true, message: `Activity "${activity.title}" deleted successfully` };
  }

  /**
   * Get activity stats (overdue count, pending, completed)
   */
  async getStats(organizationId: string) {
    const now = new Date();

    const [total, pending, completed, overdue] = await Promise.all([
      this.prisma.activity.count({ where: { organizationId } }),
      this.prisma.activity.count({ where: { organizationId, status: ActivityStatus.PENDING } }),
      this.prisma.activity.count({ where: { organizationId, status: ActivityStatus.COMPLETED } }),
      this.prisma.activity.count({
        where: {
          organizationId,
          dueAt: { lt: now },
          status: { in: [ActivityStatus.PENDING, ActivityStatus.IN_PROGRESS] },
        },
      }),
    ]);

    return {
      total,
      pending,
      completed,
      overdue,
      completionRate: total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0,
    };
  }
}
