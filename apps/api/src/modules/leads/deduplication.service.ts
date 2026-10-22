import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { DuplicateCheckResult, DuplicateMatch, LeadStatus } from '@crm/shared-types';

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalize email for accurate comparison
   */
  normalizeEmail(email?: string): string | null {
    if (!email) return null;
    return email.trim().toLowerCase();
  }

  /**
   * Normalize phone number to standard digits only
   */
  normalizePhone(phone?: string): string | null {
    if (!phone) return null;
    // Strip everything except digits and optional leading plus
    const cleaned = phone.trim().replace(/[^\d+]/g, '');
    return cleaned.length >= 6 ? cleaned : null;
  }

  /**
   * Check whether a prospective lead matches existing records in the tenant
   */
  async checkDuplicate(
    organizationId: string,
    dto: CheckDuplicateDto,
  ): Promise<DuplicateCheckResult> {
    const matches: DuplicateMatch[] = [];
    const normalizedEmail = this.normalizeEmail(dto.email);
    const normalizedPhone = this.normalizePhone(dto.phone);
    const companyClean = dto.companyName?.trim().toLowerCase();

    if (!normalizedEmail && !normalizedPhone && !companyClean) {
      return { hasDuplicate: false, matches: [] };
    }

    // 1. Check exact email duplicate
    if (normalizedEmail) {
      const emailMatches = await this.prisma.lead.findMany({
        where: {
          organizationId,
          email: { equals: normalizedEmail, mode: 'insensitive' },
          isArchived: false,
          ...(dto.excludeLeadId ? { id: { not: dto.excludeLeadId } } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
          status: true,
        },
      });

      for (const lead of emailMatches) {
        matches.push({
          leadId: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.companyName,
          status: lead.status as LeadStatus,
          matchType: 'EMAIL_EXACT',
          confidenceScore: 100,
        });
      }
    }

    // 2. Check phone duplicate
    if (normalizedPhone) {
      const phoneCandidates = await this.prisma.lead.findMany({
        where: {
          organizationId,
          phone: { not: null },
          isArchived: false,
          ...(dto.excludeLeadId ? { id: { not: dto.excludeLeadId } } : {}),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
          status: true,
        },
      });

      for (const lead of phoneCandidates) {
        if (!lead.phone) continue;
        const candidatePhoneNorm = this.normalizePhone(lead.phone);
        if (candidatePhoneNorm && (candidatePhoneNorm === normalizedPhone || candidatePhoneNorm.endsWith(normalizedPhone) || normalizedPhone.endsWith(candidatePhoneNorm))) {
          // Avoid duplicate entry if already matched by email
          if (!matches.some((m) => m.leadId === lead.id)) {
            matches.push({
              leadId: lead.id,
              firstName: lead.firstName,
              lastName: lead.lastName,
              email: lead.email,
              phone: lead.phone,
              companyName: lead.companyName,
              status: lead.status as LeadStatus,
              matchType: 'PHONE_EXACT',
              confidenceScore: 95,
            });
          }
        }
      }
    }

    // 3. Fuzzy company name duplicate
    if (companyClean && companyClean.length > 3) {
      const companyMatches = await this.prisma.lead.findMany({
        where: {
          organizationId,
          companyName: { contains: companyClean, mode: 'insensitive' },
          isArchived: false,
          ...(dto.excludeLeadId ? { id: { not: dto.excludeLeadId } } : {}),
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
          status: true,
        },
      });

      for (const lead of companyMatches) {
        if (!matches.some((m) => m.leadId === lead.id)) {
          matches.push({
            leadId: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            companyName: lead.companyName,
            status: lead.status as LeadStatus,
            matchType: 'COMPANY_NAME',
            confidenceScore: 70,
          });
        }
      }
    }

    // Sort by confidence score descending
    matches.sort((a, b) => b.confidenceScore - a.confidenceScore);

    return {
      hasDuplicate: matches.length > 0,
      matches,
    };
  }

  /**
   * Scan organization database to identify all duplicate clusters
   */
  async findOrganizationDuplicates(organizationId: string) {
    const leads = await this.prisma.lead.findMany({
      where: { organizationId, isArchived: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyName: true,
        status: true,
        createdAt: true,
      },
    });

    const emailMap = new Map<string, typeof leads>();
    const phoneMap = new Map<string, typeof leads>();

    for (const lead of leads) {
      const emailNorm = this.normalizeEmail(lead.email ?? undefined);
      if (emailNorm) {
        const list = emailMap.get(emailNorm) || [];
        list.push(lead);
        emailMap.set(emailNorm, list);
      }

      const phoneNorm = this.normalizePhone(lead.phone ?? undefined);
      if (phoneNorm) {
        const list = phoneMap.get(phoneNorm) || [];
        list.push(lead);
        phoneMap.set(phoneNorm, list);
      }
    }

    const clusters: Array<{
      criteria: 'EMAIL' | 'PHONE';
      value: string;
      leadCount: number;
      leads: typeof leads;
    }> = [];

    for (const [email, cluster] of emailMap.entries()) {
      if (cluster.length > 1) {
        clusters.push({
          criteria: 'EMAIL',
          value: email,
          leadCount: cluster.length,
          leads: cluster,
        });
      }
    }

    for (const [phone, cluster] of phoneMap.entries()) {
      if (cluster.length > 1) {
        clusters.push({
          criteria: 'PHONE',
          value: phone,
          leadCount: cluster.length,
          leads: cluster,
        });
      }
    }

    return {
      totalClusters: clusters.length,
      clusters,
    };
  }
}
