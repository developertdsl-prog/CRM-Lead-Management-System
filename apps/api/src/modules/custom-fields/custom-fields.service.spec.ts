import { CustomFieldsService } from './custom-fields.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomFieldType, EntityType } from '@crm/shared-types';

describe('CustomFieldsService', () => {
  let service: CustomFieldsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: jest.fn((cb) => cb(mockPrisma)),
      customFieldDefinition: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      customFieldValue: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new CustomFieldsService(mockPrisma as PrismaService);
  });

  describe('createDefinition', () => {
    it('should define a new custom field when not duplicate', async () => {
      mockPrisma.customFieldDefinition.findFirst.mockResolvedValueOnce(null);
      mockPrisma.customFieldDefinition.create.mockResolvedValueOnce({
        id: 'def-1',
        entityType: EntityType.COMPANY,
        fieldName: 'gstinNumber',
        fieldLabel: 'GSTIN',
        fieldType: CustomFieldType.TEXT,
      });

      const result = await service.createDefinition('org-1', {
        entityType: EntityType.COMPANY,
        fieldName: 'gstinNumber',
        fieldLabel: 'GSTIN',
        fieldType: CustomFieldType.TEXT,
      });

      expect(result.id).toBe('def-1');
      expect(result.fieldName).toBe('gstinNumber');
    });

    it('should throw error if fieldName already exists for entity', async () => {
      mockPrisma.customFieldDefinition.findFirst.mockResolvedValueOnce({ id: 'def-1' });

      await expect(
        service.createDefinition('org-1', {
          entityType: EntityType.COMPANY,
          fieldName: 'gstinNumber',
          fieldLabel: 'GSTIN',
          fieldType: CustomFieldType.TEXT,
        }),
      ).rejects.toThrow('already exists');
    });
  });
});
