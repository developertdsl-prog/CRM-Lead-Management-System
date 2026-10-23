import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, IsEnum } from 'class-validator';
import { DealStatus } from '@crm/shared-types';

export class DealQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 20;

  @ApiPropertyOptional({ description: 'Search term matching deal title, company name, or contact name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by pipeline ID' })
  @IsOptional()
  @IsString()
  pipelineId?: string;

  @ApiPropertyOptional({ description: 'Filter by stage ID' })
  @IsOptional()
  @IsString()
  stageId?: string;

  @ApiPropertyOptional({ enum: DealStatus, description: 'Filter by deal status (OPEN, WON, LOST, ABANDONED)' })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional({ description: 'Filter by owner user ID' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ description: 'Filter by associated company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by associated contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    default: 'createdAt',
    enum: ['createdAt', 'title', 'amount', 'expectedCloseDate', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
