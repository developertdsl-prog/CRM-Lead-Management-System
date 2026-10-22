import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { LeadPriority, LeadSource, LeadStatus } from '@crm/shared-types';
import { CreateLeadDto } from './create-lead.dto';

export class ImportLeadsDto {
  @ApiProperty({
    description: 'Array of lead objects parsed from CSV or bulk entry',
    type: [CreateLeadDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLeadDto)
  leads!: CreateLeadDto[];

  @ApiPropertyOptional({
    description: 'Deduplication strategy: SKIP existing, UPDATE existing, or IMPORT_ANYWAY',
    enum: ['SKIP', 'UPDATE', 'IMPORT_ANYWAY'],
    default: 'SKIP',
  })
  @IsOptional()
  @IsIn(['SKIP', 'UPDATE', 'IMPORT_ANYWAY'])
  onDuplicate: 'SKIP' | 'UPDATE' | 'IMPORT_ANYWAY' = 'SKIP';

  @ApiPropertyOptional({ enum: LeadSource, default: LeadSource.WEBSITE })
  @IsOptional()
  @IsEnum(LeadSource)
  defaultSource?: LeadSource;

  @ApiPropertyOptional({ enum: LeadStatus, default: LeadStatus.NEW })
  @IsOptional()
  @IsEnum(LeadStatus)
  defaultStatus?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadPriority, default: LeadPriority.MEDIUM })
  @IsOptional()
  @IsEnum(LeadPriority)
  defaultPriority?: LeadPriority;
}
