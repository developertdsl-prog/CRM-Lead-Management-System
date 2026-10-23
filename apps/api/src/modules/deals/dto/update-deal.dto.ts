import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { DealStatus } from '@crm/shared-types';
import { CreateDealDto } from './create-deal.dto';

export class UpdateDealDto extends PartialType(CreateDealDto) {
  @ApiPropertyOptional({ enum: DealStatus, description: 'Deal lifecycle status' })
  @IsOptional()
  @IsEnum(DealStatus)
  status?: DealStatus;

  @ApiPropertyOptional({ description: 'Explanation if the deal was marked LOST' })
  @IsOptional()
  @IsString()
  lostReason?: string;
}
