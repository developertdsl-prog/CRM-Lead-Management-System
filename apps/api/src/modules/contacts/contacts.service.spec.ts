import { ContactsService } from './contacts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ContactsService', () => {
  let service: ContactsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      contact: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new ContactsService(mockPrisma as PrismaService);
  });

  describe('create', () => {
    it('should create contact and enforce single primary contact per company', async () => {
      const mockContact = {
        id: 'cont-1',
        organizationId: 'org-1',
        companyId: 'comp-1',
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana@themyscira.gov',
        isPrimary: true,
      };

      mockPrisma.contact.create.mockResolvedValueOnce(mockContact);

      const result = await service.create('org-1', {
        companyId: 'comp-1',
        firstName: 'Diana',
        lastName: 'Prince',
        email: 'diana@themyscira.gov',
        isPrimary: true,
      });

      expect(mockPrisma.contact.updateMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-1', companyId: 'comp-1', isPrimary: true },
        data: { isPrimary: false },
      });
      expect(mockPrisma.contact.create).toHaveBeenCalled();
      expect(result.id).toBe('cont-1');
    });
  });
});
