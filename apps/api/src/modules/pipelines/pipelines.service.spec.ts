import { PipelinesService } from './pipelines.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PipelinesService', () => {
  let service: PipelinesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => {
        if (typeof cb === 'function') {
          return cb(mockPrisma);
        }
        return Promise.all(cb);
      }),
      pipeline: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      stage: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      deal: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new PipelinesService(mockPrisma as PrismaService);
  });

  describe('findAll', () => {
    it('should return list of pipelines enriched with deal totals and stage metrics', async () => {
      mockPrisma.pipeline.findMany.mockResolvedValueOnce([
        {
          id: 'pipe-1',
          name: 'Sales Pipeline',
          isDefault: true,
          _count: { deals: 2 },
          stages: [
            {
              id: 'stage-1',
              name: 'Discovery',
              order: 1,
              winProbability: 20,
              _count: { deals: 2 },
            },
          ],
        },
      ]);

      mockPrisma.deal.findMany.mockResolvedValueOnce([
        { pipelineId: 'pipe-1', stageId: 'stage-1', amount: 15000 },
        { pipelineId: 'pipe-1', stageId: 'stage-1', amount: 25000 },
      ]);

      const result = await service.findAll('org-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pipe-1');
      expect(result[0].dealCount).toBe(2);
      expect(result[0].totalDealValue).toBe(40000);
      expect(result[0].stages[0].totalDealValue).toBe(40000);
    });

    it('should auto-create default pipeline if none exists', async () => {
      mockPrisma.pipeline.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'pipe-default',
            name: 'Standard Sales Pipeline',
            isDefault: true,
            _count: { deals: 0 },
            stages: [],
          },
        ]);
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce(null);
      mockPrisma.pipeline.create.mockResolvedValueOnce({
        id: 'pipe-default',
        name: 'Standard Sales Pipeline',
        isDefault: true,
        stages: [],
      });
      mockPrisma.deal.findMany.mockResolvedValueOnce([]);

      const result = await service.findAll('org-1');

      expect(mockPrisma.pipeline.create).toHaveBeenCalled();
      expect(result[0].id).toBe('pipe-default');
    });
  });

  describe('create', () => {
    it('should create new pipeline with default stages if none provided', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce(null); // not duplicate
      mockPrisma.pipeline.count.mockResolvedValueOnce(1); // not first
      mockPrisma.pipeline.create.mockResolvedValueOnce({
        id: 'pipe-2',
        name: 'Enterprise Pipeline',
        isDefault: false,
        stages: [{ id: 'stg-1', name: 'Discovery / Qualification', order: 1 }],
      });

      const result = await service.create('org-1', {
        name: 'Enterprise Pipeline',
      });

      expect(mockPrisma.pipeline.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Enterprise Pipeline',
            stages: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({ name: 'Discovery / Qualification' }),
                expect.objectContaining({ name: 'Closed Won' }),
              ]),
            }),
          }),
        }),
      );
      expect(result.id).toBe('pipe-2');
    });

    it('should throw BadRequestException on duplicate pipeline name', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1', name: 'Standard' });

      await expect(
        service.create('org-1', { name: 'Standard' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should throw error if attempting to delete default pipeline', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({
        id: 'pipe-1',
        isDefault: true,
        name: 'Default',
      });

      await expect(service.delete('org-1', 'pipe-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error if pipeline contains active deals', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({
        id: 'pipe-1',
        isDefault: false,
        name: 'Old Pipeline',
      });
      mockPrisma.deal.count.mockResolvedValueOnce(3);

      await expect(service.delete('org-1', 'pipe-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reorderStages', () => {
    it('should update stage orders within a pipeline', async () => {
      mockPrisma.pipeline.findFirst.mockResolvedValueOnce({ id: 'pipe-1' });
      mockPrisma.stage.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.stage.findMany.mockResolvedValueOnce([
        { id: 's2', order: 1 },
        { id: 's1', order: 2 },
      ]);

      const result = await service.reorderStages('org-1', 'pipe-1', {
        stageOrders: [
          { id: 's2', order: 1 },
          { id: 's1', order: 2 },
        ],
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('s2');
      expect(mockPrisma.stage.updateMany).toHaveBeenCalledTimes(2);
    });
  });
});
