import { DealsService } from './deals.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { DealStatus, EntityType } from '@crm/shared-types';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('DealsService', () => {
  let service: DealsService;
  let mockPrisma: any;
  let mockCustomFields: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      deal: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      pipeline: {
        findFirst: jest.fn(),
      },
      stage: {
        findFirst: jest.fn(),
      },
      company: {
        findFirst: jest.fn(),
      },
      contact: {
        findFirst: jest.fn(),
      },
    };

    mockCustomFields = {
      setValues: jest.fn().mockResolvedValue([]),
      getValues: jest.fn().mockResolvedValue({ tier_preference: 'Gold' }),
    };

    service = new DealsService(
      mockPrisma as PrismaService,
      mockCustomFields as CustomFieldsService,
    );
  });

  describe('create', () => {
    it('should create deal, verify pipeline/stage, and store custom fields', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({
        id: 'pipe-1',
        name: 'Sales Pipeline',
        stages: [
          { id: 'stg-1', name: 'Discovery', winProbability: 25 },
        ],
      });

      mockPrisma.deal.create.mockResolvedValueOnce({
        id: 'deal-1',
        organizationId: 'org-1',
        title: 'Cybersecurity Contract',
        amount: 80000,
        currency: 'USD',
        status: DealStatus.OPEN,
        pipelineId: 'pipe-1',
        stageId: 'stg-1',
      });

      const result = await service.create(
        'org-1',
        {
          title: 'Cybersecurity Contract',
          amount: 80000,
          pipelineId: 'pipe-1',
          stageId: 'stg-1',
          customFields: { tier_preference: 'Gold' },
        },
        'user-1',
      );

      expect(result.id).toBe('deal-1');
      expect(result.amount).toBe(80000);
      expect(mockCustomFields.setValues).toHaveBeenCalledWith(
        'org-1',
        EntityType.DEAL,
        'deal-1',
        { tier_preference: 'Gold' },
      );
      expect(result.customFields).toEqual({ tier_preference: 'Gold' });
    });

    it('should auto-mark status as WON when created in a 100% winProbability stage', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({
        id: 'pipe-1',
        name: 'Sales Pipeline',
        stages: [
          { id: 'stg-won', name: 'Closed Won', winProbability: 100 },
        ],
      });

      mockPrisma.deal.create.mockImplementationOnce((args: any) => ({
        id: 'deal-won',
        ...args.data,
      }));

      const result = await service.create('org-1', {
        title: 'Already Won Deal',
        amount: 120000,
        pipelineId: 'pipe-1',
        stageId: 'stg-won',
      });

      expect(mockPrisma.deal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DealStatus.WON,
            actualCloseDate: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe(DealStatus.WON);
    });
  });

  describe('changeStage', () => {
    it('should transition deal to WON stage and set actualCloseDate', async () => {
      mockPrisma.deal.findFirst.mockResolvedValueOnce({
        id: 'deal-1',
        organizationId: 'org-1',
        status: DealStatus.OPEN,
        actualCloseDate: null,
      });

      mockPrisma.stage.findFirst.mockResolvedValueOnce({
        id: 'stg-won',
        pipelineId: 'pipe-1',
        name: 'Closed Won',
        winProbability: 100,
      });

      mockPrisma.deal.update.mockResolvedValueOnce({
        id: 'deal-1',
        stageId: 'stg-won',
        pipelineId: 'pipe-1',
        status: DealStatus.WON,
        amount: 50000,
        actualCloseDate: new Date(),
      });

      const result = await service.changeStage('org-1', 'deal-1', {
        stageId: 'stg-won',
      });

      expect(mockPrisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DealStatus.WON,
            actualCloseDate: expect.any(Date),
            lostReason: null,
          }),
        }),
      );
      expect(result.status).toBe(DealStatus.WON);
    });

    it('should transition deal to LOST stage and record lostReason', async () => {
      mockPrisma.deal.findFirst.mockResolvedValueOnce({
        id: 'deal-1',
        organizationId: 'org-1',
        status: DealStatus.OPEN,
      });

      mockPrisma.stage.findFirst.mockResolvedValueOnce({
        id: 'stg-lost',
        pipelineId: 'pipe-1',
        name: 'Closed Lost',
        winProbability: 0,
      });

      mockPrisma.deal.update.mockResolvedValueOnce({
        id: 'deal-1',
        stageId: 'stg-lost',
        pipelineId: 'pipe-1',
        status: DealStatus.LOST,
        amount: 25000,
        lostReason: 'Budget constraints',
      });

      const result = await service.changeStage('org-1', 'deal-1', {
        stageId: 'stg-lost',
        lostReason: 'Budget constraints',
      });

      expect(mockPrisma.deal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DealStatus.LOST,
            lostReason: 'Budget constraints',
          }),
        }),
      );
      expect(result.status).toBe(DealStatus.LOST);
    });
  });

  describe('getForecast', () => {
    it('should accurately compute weighted pipeline revenue forecast and win rates', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({
        id: 'pipe-1',
        name: 'Standard Pipeline',
        stages: [
          { id: 's1', name: 'Discovery', order: 1, winProbability: 20, color: '#3B82F6' },
          { id: 's2', name: 'Proposal', order: 2, winProbability: 50, color: '#F59E0B' },
          { id: 's3', name: 'Closed Won', order: 3, winProbability: 100, color: '#10B981' },
          { id: 's4', name: 'Closed Lost', order: 4, winProbability: 0, color: '#EF4444' },
        ],
      });

      mockPrisma.deal.findMany.mockResolvedValueOnce([
        { id: 'd1', stageId: 's1', amount: 10000, status: DealStatus.OPEN }, // weighted: 2,000
        { id: 'd2', stageId: 's2', amount: 20000, status: DealStatus.OPEN }, // weighted: 10,000
        { id: 'd3', stageId: 's3', amount: 30000, status: DealStatus.WON },  // won: 30,000, weighted: 30,000
        { id: 'd4', stageId: 's4', amount: 10000, status: DealStatus.LOST }, // lost: 10,000
      ]);

      const forecast = await service.getForecast('org-1', 'pipe-1');

      expect(forecast.totalDeals).toBe(4);
      expect(forecast.openDealsCount).toBe(2);
      expect(forecast.totalPipelineValue).toBe(30000); // 10000 + 20000 open
      expect(forecast.wonDealsCount).toBe(1);
      expect(forecast.wonDealsValue).toBe(30000);
      expect(forecast.lostDealsCount).toBe(1);
      expect(forecast.lostDealsValue).toBe(10000);
      expect(forecast.winRate).toBe(50); // 1 won out of 2 closed = 50%
      expect(forecast.averageDealSize).toBe(17500); // 70000 / 4
      expect(forecast.weightedForecastValue).toBe(42000); // 2000 + 10000 + 30000
      expect(forecast.stageBreakdown).toHaveLength(4);
      expect(forecast.stageBreakdown[0].weightedAmount).toBe(2000);
      expect(forecast.stageBreakdown[1].weightedAmount).toBe(10000);
    });
  });
});
