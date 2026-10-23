import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  IsObject,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @ApiProperty({ description: 'Deal title / opportunity name', example: 'Enterprise Cloud Migration Contract' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Deal contract value / monetary amount', example: 75000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ description: 'Currency ISO-4217 code', example: 'USD', default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Target sales pipeline ID', example: 'cly123pipeline' })
  @IsString()
  @IsNotEmpty()
  pipelineId!: string;

  @ApiProperty({ description: 'Initial stage ID within the pipeline', example: 'cly123stage' })
  @IsString()
  @IsNotEmpty()
  stageId!: string;

  @ApiPropertyOptional({ description: 'Associated company ID', example: 'cly123company' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Primary contact person ID', example: 'cly123contact' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Converted originating lead ID if applicable', example: 'cly123lead' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Sales rep user ID responsible for this deal' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Estimated close date in ISO format', example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;

  @ApiPropertyOptional({
    description: 'Dynamic custom field values map keyed by field name',
    example: { contract_type: 'ANNUAL', lead_source_sub: 'Inbound Demo' },
  })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
