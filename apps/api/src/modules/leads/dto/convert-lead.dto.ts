import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ConvertLeadDto {
  @ApiPropertyOptional({
    description: 'Whether to create an associated deal atomically',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  createDeal?: boolean;

  @ApiPropertyOptional({
    description: 'Deal title / name (defaults to Company Name or Lead Name)',
    example: 'Cyberdyne Systems - Enterprise CRM Expansion',
  })
  @IsOptional()
  @IsString()
  dealTitle?: string;

  @ApiPropertyOptional({
    description: 'Deal monetary value (defaults to estimatedValue of lead)',
    example: 45000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dealAmount?: number;

  @ApiPropertyOptional({
    description: 'Target sales pipeline ID (defaults to primary/default pipeline)',
  })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({
    description: 'Initial stage ID within pipeline (defaults to first stage)',
  })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({
    description: 'Target expected closing date (ISO 8601 string)',
    example: '2026-12-31T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  expectedCloseDate?: string;
}
