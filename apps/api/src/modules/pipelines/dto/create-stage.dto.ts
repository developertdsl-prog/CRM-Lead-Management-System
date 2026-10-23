import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStageDto {
  @ApiProperty({ description: 'Stage name', example: 'Discovery / Demo' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Display order index in pipeline', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ description: 'Win probability percentage (0 - 100)', example: 40, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  winProbability?: number;

  @ApiPropertyOptional({ description: 'Hex or Tailwind color code for stage column', example: '#3B82F6', default: '#3B82F6' })
  @IsOptional()
  @IsString()
  color?: string;
}
