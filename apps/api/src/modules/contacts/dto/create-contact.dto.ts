import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ description: 'First name', example: 'Pepper' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ description: 'Last name', example: 'Potts' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ description: 'Primary email address', example: 'pepper.potts@stark.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+1-555-019-1002' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Mobile phone number', example: '+1-555-019-1003' })
  @IsOptional()
  @IsString()
  mobilePhone?: string;

  @ApiPropertyOptional({ description: 'Associated Company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Job Title', example: 'Chief Executive Officer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ description: 'Department', example: 'Executive Management' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Whether this contact is the primary decision maker', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
