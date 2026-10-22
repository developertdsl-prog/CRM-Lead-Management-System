import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertAccountDto {
  @ApiPropertyOptional({ description: 'Customer status', example: 'ACTIVE', default: 'ACTIVE' })
  @IsOptional()
  @IsString()
  customerStatus?: string;

  @ApiPropertyOptional({ description: 'Customer Tier', example: 'ENTERPRISE', default: 'STANDARD' })
  @IsOptional()
  @IsString()
  tier?: string;

  @ApiPropertyOptional({ description: 'Dedicated Account Manager User ID' })
  @IsOptional()
  @IsString()
  accountManagerId?: string;

  @ApiPropertyOptional({ description: 'Health score (0 - 100)', example: 92, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  healthScore?: number;

  @ApiPropertyOptional({ description: 'Monthly Recurring Revenue ($)', example: 4500.0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mrr?: number;

  @ApiPropertyOptional({ description: 'Contract start date (ISO 8601)', example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  contractStartDate?: string;

  @ApiPropertyOptional({ description: 'Contract renewal/end date (ISO 8601)', example: '2027-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  contractEndDate?: string;
}
