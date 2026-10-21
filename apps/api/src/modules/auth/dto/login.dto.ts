import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@crmenterprise.com' })
  @IsEmail({}, { message: 'A valid email is required' })
  email!: string;

  @ApiProperty({ example: 'AdminStrongPassword!123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
