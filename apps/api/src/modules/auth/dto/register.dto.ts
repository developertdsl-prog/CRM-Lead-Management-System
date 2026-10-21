import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'sarah.founder@acmecorp.com', description: 'User corporate email' })
  @IsEmail({}, { message: 'A valid email address is required' })
  email!: string;

  @ApiProperty({ example: 'AdminStrongPassword!123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Sarah' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Vance' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ example: 'Acme Global Corporation' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required' })
  organizationName!: string;

  @ApiProperty({ example: 'acme-global', required: false })
  @IsString()
  @IsOptional()
  organizationSlug?: string;
}
