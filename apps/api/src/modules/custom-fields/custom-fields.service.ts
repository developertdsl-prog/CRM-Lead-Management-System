import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDefinitionDto } from './dto/create-custom-field-definition.dto';
import { CustomFieldType, EntityType, CustomFieldValueDto } from '@crm/shared-types';
import { Prisma } from '@crm/database';

@Injectable()
export class CustomFieldsService {
  private readonly logger = new Logger(CustomFieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create or define a dynamic custom field for an entity
   */
  async createDefinition(organizationId: string, dto: CreateCustomFieldDefinitionDto) {
    const fieldNameClean = dto.fieldName.trim().replace(/[^a-zA-Z0-9_]/g, '');

    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: {
        organizationId,
        entityType: dto.entityType,
        fieldName: fieldNameClean,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Custom field "${fieldNameClean}" already exists for ${dto.entityType}`,
      );
    }

    const definition = await this.prisma.customFieldDefinition.create({
      data: {
        organizationId,
        entityType: dto.entityType,
        fieldName: fieldNameClean,
        fieldLabel: dto.fieldLabel.trim(),
        fieldType: dto.fieldType,
        isRequired: dto.isRequired ?? false,
        options: dto.options ? (dto.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        defaultValue: dto.defaultValue?.trim() ?? null,
      },
    });

    return definition;
  }

  /**
   * Get all custom field definitions for a tenant and entity type
   */
  async getDefinitions(organizationId: string, entityType?: EntityType) {
    return this.prisma.customFieldDefinition.findMany({
      where: {
        organizationId,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Delete a custom field definition
   */
  async deleteDefinition(organizationId: string, id: string) {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Custom field definition "${id}" not found`);
    }

    await this.prisma.customFieldDefinition.delete({ where: { id } });
    return { success: true, message: `Custom field "${existing.fieldLabel}" deleted` };
  }

  /**
   * Set and validate custom field values for a specific record
   */
  async setValues(
    organizationId: string,
    entityType: EntityType,
    entityId: string,
    fieldMap: Record<string, unknown>,
  ) {
    const definitions = await this.prisma.customFieldDefinition.findMany({
      where: { organizationId, entityType },
    });

    const results: CustomFieldValueDto[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const def of definitions) {
        if (!(def.fieldName in fieldMap)) {
          if (def.isRequired) {
            throw new BadRequestException(`Field "${def.fieldLabel}" is required.`);
          }
          continue;
        }

        const rawValue = fieldMap[def.fieldName];
        let valueText: string | null = null;
        let valueNumber: Prisma.Decimal | null = null;
        let valueBoolean: boolean | null = null;
        let valueDate: Date | null = null;
        let valueJson: any = Prisma.JsonNull;

        if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
          switch (def.fieldType) {
            case CustomFieldType.TEXT:
              valueText = String(rawValue);
              break;
            case CustomFieldType.SELECT:
              const allowedOptions = Array.isArray(def.options) ? (def.options as string[]) : [];
              if (allowedOptions.length > 0 && !allowedOptions.includes(String(rawValue))) {
                throw new BadRequestException(
                  `Invalid option "${rawValue}" for field "${def.fieldLabel}". Allowed: ${allowedOptions.join(
                    ', ',
                  )}`,
                );
              }
              valueText = String(rawValue);
              break;
            case CustomFieldType.NUMBER:
              const num = Number(rawValue);
              if (isNaN(num)) {
                throw new BadRequestException(`Field "${def.fieldLabel}" must be a valid number.`);
              }
              valueNumber = new Prisma.Decimal(num);
              break;
            case CustomFieldType.BOOLEAN:
              valueBoolean = Boolean(rawValue);
              break;
            case CustomFieldType.DATE:
              const date = new Date(String(rawValue));
              if (isNaN(date.getTime())) {
                throw new BadRequestException(`Field "${def.fieldLabel}" must be a valid ISO date.`);
              }
              valueDate = date;
              break;
            case CustomFieldType.MULTI_SELECT:
              if (!Array.isArray(rawValue)) {
                throw new BadRequestException(`Field "${def.fieldLabel}" must be an array of values.`);
              }
              valueJson = rawValue as unknown as Prisma.InputJsonValue;
              break;
          }
        }

        // Upsert custom field value record
        const existingVal = await tx.customFieldValue.findFirst({
          where: { organizationId, entityType, entityId, definitionId: def.id },
        });

        if (existingVal) {
          await tx.customFieldValue.update({
            where: { id: existingVal.id },
            data: {
              valueText,
              valueNumber,
              valueBoolean,
              valueDate,
              valueJson,
            },
          });
        } else {
          await tx.customFieldValue.create({
            data: {
              organizationId,
              definitionId: def.id,
              entityType,
              entityId,
              valueText,
              valueNumber,
              valueBoolean,
              valueDate,
              valueJson,
            },
          });
        }

        results.push({
          definitionId: def.id,
          fieldName: def.fieldName,
          fieldLabel: def.fieldLabel,
          fieldType: def.fieldType as unknown as CustomFieldType,
          isRequired: def.isRequired,
          options: Array.isArray(def.options) ? (def.options as string[]) : undefined,
          value: rawValue,
        });
      }
    });

    return results;
  }

  /**
   * Retrieve all custom field values formatted for an entity
   */
  async getValues(
    organizationId: string,
    entityType: EntityType,
    entityId: string,
  ): Promise<Record<string, unknown>> {
    const [definitions, values] = await Promise.all([
      this.prisma.customFieldDefinition.findMany({
        where: { organizationId, entityType },
      }),
      this.prisma.customFieldValue.findMany({
        where: { organizationId, entityType, entityId },
      }),
    ]);

    const valueMap = new Map<string, any>();
    for (const v of values) {
      valueMap.set(v.definitionId, v);
    }

    const result: Record<string, unknown> = {};

    for (const def of definitions) {
      const v = valueMap.get(def.id);
      if (!v) {
        result[def.fieldName] = def.defaultValue ?? null;
        continue;
      }

      switch (def.fieldType) {
        case CustomFieldType.TEXT:
        case CustomFieldType.SELECT:
          result[def.fieldName] = v.valueText;
          break;
        case CustomFieldType.NUMBER:
          result[def.fieldName] = v.valueNumber ? Number(v.valueNumber) : null;
          break;
        case CustomFieldType.BOOLEAN:
          result[def.fieldName] = v.valueBoolean;
          break;
        case CustomFieldType.DATE:
          result[def.fieldName] = v.valueDate;
          break;
        case CustomFieldType.MULTI_SELECT:
          result[def.fieldName] = v.valueJson;
          break;
      }
    }

    return result;
  }
}
