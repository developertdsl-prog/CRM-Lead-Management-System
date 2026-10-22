import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      company: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      account: {
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new CompaniesService(mockPrisma as PrismaService);
  });

  describe('create', () => {
    it('should create company and auto-initialize Account 360 record', async () => {
      const mockCompany = {
        id: 'comp-1',
        organizationId: 'org-1',
        name: 'Wayne Enterprises',
        domain: 'wayne.corp',
      };

      const mockAccount = {
        id: 'acc-1',
        companyId: 'comp-1',
        customerStatus: 'ACTIVE',
        healthScore: 100,
      };

      mockPrisma.company.create.mockResolvedValueOnce(mockCompany);
      mockPrisma.account.create.mockResolvedValueOnce(mockAccount);

      const result = await service.create(
        'org-1',
        { name: 'Wayne Enterprises', domain: 'wayne.corp' },
        'user-1',
      );

      expect(mockPrisma.company.create).toHaveBeenCalled();
      expect(mockPrisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'comp-1',
            customerStatus: 'ACTIVE',
            healthScore: 100,
          }),
        }),
      );
      expect(result.id).toBe('comp-1');
      expect(result.account).toEqual(mockAccount);
    });
  });

  describe('getAccount360', () => {
    it('should aggregate company, account, contacts, and active deals', async () => {
      const mockCompany = {
        id: 'comp-1',
        name: 'Stark Industries',
        account: {
          id: 'acc-1',
          customerStatus: 'ACTIVE',
          tier: 'ENTERPRISE',
          healthScore: 98,
          mrr: 15000,
        },
        contacts: [
          { id: 'cont-1', firstName: 'Pepper', lastName: 'Potts', isPrimary: true },
        ],
        deals: [
          {
            id: 'deal-1',
            title: 'Arc Reactor Deal',
            amount: 500000,
            currency: 'USD',
            status: 'OPEN',
            stage: { id: 'stg-1', name: 'Proposal' },
          },
        ],
        activities: [],
      };

      mockPrisma.company.findFirst.mockResolvedValueOnce(mockCompany);

      const result = await service.getAccount360('org-1', 'comp-1');

      expect(result.company.name).toBe('Stark Industries');
      expect(result.account?.healthScore).toBe(98);
      expect(result.deals.totalValue).toBe(500000);
      expect(result.contacts.length).toBe(1);
      expect(result.contacts[0].isPrimary).toBe(true);
    });
  });
});
