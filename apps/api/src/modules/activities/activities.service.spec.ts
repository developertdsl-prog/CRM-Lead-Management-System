import { ActivitiesService } from './activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityStatus, ActivityType, ActivityPriority } from '@crm/shared-types';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      activity: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new ActivitiesService(mockPrisma as PrismaService);
  });

  describe('create', () => {
    it('should create an activity and assign creator ID', async () => {
      const mockActivity = {
        id: 'act-1',
        title: 'Call prospect',
        type: ActivityType.CALL,
        status: ActivityStatus.PENDING,
        createdById: 'user-1',
        assignedToId: 'user-1',
      };

      mockPrisma.activity.create.mockResolvedValueOnce(mockActivity);

      const result = await service.create(
        'org-1',
        {
          title: 'Call prospect',
          type: ActivityType.CALL,
        },
        'user-1',
      );

      expect(mockPrisma.activity.create).toHaveBeenCalled();
      expect(result.id).toBe('act-1');
    });
  });

  describe('markComplete', () => {
    it('should update status to COMPLETED and set completedAt timestamp', async () => {
      mockPrisma.activity.findFirst.mockResolvedValueOnce({
        id: 'act-1',
        organizationId: 'org-1',
        status: ActivityStatus.PENDING,
      });

      mockPrisma.activity.update.mockResolvedValueOnce({
        id: 'act-1',
        status: ActivityStatus.COMPLETED,
        completedAt: new Date(),
        outcome: 'Client agreed to proceed',
      });

      const result = await service.markComplete('org-1', 'act-1', 'Client agreed to proceed');

      expect(result.status).toBe(ActivityStatus.COMPLETED);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ActivityStatus.COMPLETED,
            completedAt: expect.any(Date),
            outcome: 'Client agreed to proceed',
          }),
        }),
      );
    });
  });

  describe('getStats', () => {
    it('should aggregate total, pending, and overdue counts', async () => {
      mockPrisma.activity.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(4)  // pending
        .mockResolvedValueOnce(5)  // completed
        .mockResolvedValueOnce(1); // overdue

      const stats = await service.getStats('org-1');

      expect(stats.total).toBe(10);
      expect(stats.pending).toBe(4);
      expect(stats.completed).toBe(5);
      expect(stats.overdue).toBe(1);
      expect(stats.completionRate).toBe(50);
    });
  });
});
