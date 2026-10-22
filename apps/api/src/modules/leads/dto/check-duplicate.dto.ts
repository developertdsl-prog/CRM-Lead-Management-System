import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckDuplicateDto {
  @ApiPropertyOptional({ description: 'Email address to test for duplicates', example: 'alex@example.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number to test for duplicates', example: '+1-555-0199' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company name for fuzzy matching', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Exclude existing lead ID when updating an existing lead' })
  @IsOptional()
  @IsString()
  excludeLeadId?: string;
}
