import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdatePipelineDto {
  @ApiPropertyOptional({ description: 'Pipeline display name', example: 'Key Accounts Pipeline' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Set as default pipeline for tenant' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
