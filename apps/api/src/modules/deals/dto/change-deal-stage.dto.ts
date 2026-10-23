import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { DealStatus } from '@crm/shared-types';

export class ChangeDealStageDto {
  @ApiProperty({ description: 'Target stage ID to transition deal into', example: 'cly123stage' })
  @IsString()
  @IsNotEmpty()
  stageId!: string;

  @ApiPropertyOptional({
    enum: DealStatus,
    description: 'Explicit status override (WON, LOST, OPEN)',
    example: DealStatus.WON,
  })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional({
    description: 'Mandatory reason if status is transitioning to LOST',
    example: 'Budget cut / competitor chosen',
  })
  @IsOptional()
  @IsString()
  lostReason?: string;
}
