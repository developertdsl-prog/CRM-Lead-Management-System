import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiPropertyOptional({
    description: 'Reason why lead was marked lost / unqualified',
    example: 'Budget cut for current fiscal quarter',
  })
  @IsOptional()
  @IsString()
  lostReason?: string;

  @ApiPropertyOptional({
    description: 'Optional note describing reason for status change',
    example: 'Client completed intro discovery call, ready for proposal',
  })
  @IsOptional()
  @IsString()
  statusNote?: string;
}
