import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStageDto } from './create-stage.dto';

export class CreatePipelineDto {
  @ApiProperty({ description: 'Pipeline display name', example: 'Enterprise Sales' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Whether this pipeline is the default one for the organization', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Initial stages to create with this pipeline',
    type: [CreateStageDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages?: CreateStageDto[];
}
