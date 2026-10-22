import { LeadsService } from './leads.service';
import { DeduplicationService } from './deduplication.service';
import { CsvService } from './csv.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeadPriority, LeadSource, LeadStatus } from '@crm/shared-types';

describe('LeadsService', () => {
  let service: LeadsService;
  let mockPrisma: any;
  let mockDeduplicationService: any;
  let mockCsvService: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      lead: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      leadStatusHistory: {
        create: jest.fn(),
      },
      company: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      contact: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      pipeline: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      deal: {
        create: jest.fn(),
      },
      activity: {
        create: jest.fn(),
      },
    };

    mockDeduplicationService = {
      checkDuplicate: jest.fn(),
      findOrganizationDuplicates: jest.fn(),
    };

    mockCsvService = {
      generateLeadCsv: jest.fn(),
      parseLeadCsv: jest.fn(),
    };

    service = new LeadsService(
      mockPrisma as PrismaService,
      mockDeduplicationService as DeduplicationService,
      mockCsvService as CsvService,
    );
  });

  describe('create', () => {
    it('should create lead and record initial status history entry', async () => {
      const mockLead = {
        id: 'lead-1',
        organizationId: 'org-1',
        firstName: 'Bruce',
        lastName: 'Wayne',
        email: 'bruce@wayne.corp',
        status: LeadStatus.NEW,
      };

      mockPrisma.lead.create.mockResolvedValueOnce(mockLead);

      const result = await service.create(
        'org-1',
        {
          firstName: 'Bruce',
          lastName: 'Wayne',
          email: 'bruce@wayne.corp',
          source: LeadSource.WEBSITE,
        },
        'user-1',
      );

      expect(mockPrisma.lead.create).toHaveBeenCalled();
      expect(mockPrisma.leadStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          oldStatus: LeadStatus.NEW,
          newStatus: LeadStatus.NEW,
          changedById: 'user-1',
        }),
      });
      expect(result).toEqual(mockLead);
    });
  });

  describe('update', () => {
    it('should record status history when status changes', async () => {
      const existing = {
        id: 'lead-1',
        organizationId: 'org-1',
        status: LeadStatus.NEW,
        isArchived: false,
      };

      mockPrisma.lead.findFirst.mockResolvedValueOnce(existing);
      mockPrisma.lead.update.mockResolvedValueOnce({
        ...existing,
        status: LeadStatus.QUALIFIED,
      });

      await service.update(
        'org-1',
        'lead-1',
        {
          status: LeadStatus.QUALIFIED,
          statusNote: 'Passed budget & authority discovery',
        },
        'user-1',
      );

      expect(mockPrisma.leadStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          leadId: 'lead-1',
          oldStatus: LeadStatus.NEW,
          newStatus: LeadStatus.QUALIFIED,
          changedById: 'user-1',
          note: 'Passed budget & authority discovery',
        }),
      });
    });
  });

  describe('convertLead', () => {
    it('should atomically create Company, Contact, Deal, and set Lead status to CONVERTED', async () => {
      const lead = {
        id: 'lead-100',
        organizationId: 'org-1',
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana@themyscira.gov',
        phone: '+1-555-0101',
        companyName: 'Themyscira Cultural Museum',
        status: LeadStatus.QUALIFIED,
        estimatedValue: 75000,
        currency: 'USD',
        isArchived: false,
      };

      mockPrisma.lead.findFirst.mockResolvedValueOnce(lead);
      mockPrisma.company.findFirst.mockResolvedValueOnce(null);
      mockPrisma.company.create.mockResolvedValueOnce({
        id: 'comp-1',
        name: 'Themyscira Cultural Museum',
      });

      mockPrisma.contact.findFirst.mockResolvedValueOnce(null);
      mockPrisma.contact.create.mockResolvedValueOnce({
        id: 'cont-1',
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana@themyscira.gov',
      });

      const defaultPipeline = {
        id: 'pipe-1',
        name: 'Default Pipeline',
        stages: [{ id: 'stg-1', name: 'Discovery', order: 1 }],
      };
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce(defaultPipeline);

      mockPrisma.deal.create.mockResolvedValueOnce({
        id: 'deal-1',
        title: 'Themyscira Cultural Museum - Opportunity',
        amount: 75000,
      });

      mockPrisma.lead.update.mockResolvedValueOnce({
        ...lead,
        status: LeadStatus.CONVERTED,
        convertedContactId: 'cont-1',
        convertedCompanyId: 'comp-1',
        convertedDealId: 'deal-1',
      });

      const result = await service.convertLead(
        'org-1',
        'lead-100',
        { createDeal: true },
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(mockPrisma.company.create).toHaveBeenCalled();
      expect(mockPrisma.contact.create).toHaveBeenCalled();
      expect(mockPrisma.deal.create).toHaveBeenCalled();
      expect(mockPrisma.lead.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: LeadStatus.CONVERTED,
            convertedContactId: 'cont-1',
            convertedCompanyId: 'comp-1',
            convertedDealId: 'deal-1',
          }),
        }),
      );
      expect(mockPrisma.leadStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            newStatus: LeadStatus.CONVERTED,
          }),
        }),
      );
    });
  });
});
