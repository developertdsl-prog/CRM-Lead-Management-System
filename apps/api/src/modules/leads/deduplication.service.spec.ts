import { DeduplicationService } from './deduplication.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DeduplicationService', () => {
  let service: DeduplicationService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      lead: {
        findMany: jest.fn(),
      },
    };
    service = new DeduplicationService(mockPrisma as PrismaService);
  });

  describe('normalizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(service.normalizeEmail('  John.Doe@Example.COM ')).toBe('john.doe@example.com');
    });

    it('should return null for empty/undefined email', () => {
      expect(service.normalizeEmail(undefined)).toBeNull();
      expect(service.normalizeEmail('')).toBeNull();
    });
  });

  describe('normalizePhone', () => {
    it('should strip special characters and spaces from phone number', () => {
      expect(service.normalizePhone('+1 (555) 019-2834')).toBe('+15550192834');
      expect(service.normalizePhone('555-019-2834')).toBe('5550192834');
    });

    it('should return null if phone is too short', () => {
      expect(service.normalizePhone('123')).toBeNull();
    });
  });

  describe('checkDuplicate', () => {
    it('should identify exact email duplicates with 100 confidence', async () => {
      mockPrisma.lead.findMany.mockResolvedValueOnce([
        {
          id: 'lead-1',
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@wonderland.com',
          phone: null,
          companyName: 'Wonderland Ltd',
          status: 'NEW',
        },
      ]);

      const result = await service.checkDuplicate('org-123', {
        email: 'alice@wonderland.com',
      });

      expect(result.hasDuplicate).toBe(true);
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].matchType).toBe('EMAIL_EXACT');
      expect(result.matches[0].confidenceScore).toBe(100);
    });

    it('should return false if no duplicates exist', async () => {
      mockPrisma.lead.findMany.mockResolvedValue([]);

      const result = await service.checkDuplicate('org-123', {
        email: 'unique@corp.com',
        phone: '+1-555-999-0000',
      });

      expect(result.hasDuplicate).toBe(false);
      expect(result.matches.length).toBe(0);
    });
  });
});
