import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CustomFieldType, EntityType } from '@crm/shared-types';

export class CreateCustomFieldDefinitionDto {
  @ApiProperty({ enum: EntityType, example: EntityType.COMPANY })
  @IsEnum(EntityType)
  entityType!: EntityType;

  @ApiProperty({ description: 'Technical field key', example: 'gstinNumber' })
  @IsString()
  @IsNotEmpty()
  fieldName!: string;

  @ApiProperty({ description: 'Human-readable label', example: 'GST / Tax ID' })
  @IsString()
  @IsNotEmpty()
  fieldLabel!: string;

  @ApiProperty({ enum: CustomFieldType, example: CustomFieldType.TEXT })
  @IsEnum(CustomFieldType)
  fieldType!: CustomFieldType;

  @ApiPropertyOptional({ description: 'Whether this field is mandatory', default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Allowed options for SELECT or MULTI_SELECT types',
    example: ['Direct', 'Channel Partner', 'Self-Serve'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Default fallback value' })
  @IsOptional()
  @IsString()
  defaultValue?: string;
}
