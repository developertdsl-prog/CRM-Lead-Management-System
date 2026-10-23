import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class StageOrderItemDto {
  @ApiProperty({ description: 'Stage unique ID', example: 'clx123abc' })
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ description: 'New order position (0-indexed or 1-indexed)', example: 1 })
  @Type(() => Number)
  @IsInt()
  order!: number;
}

export class ReorderStagesDto {
  @ApiProperty({
    description: 'Array of stage IDs with their target orders',
    type: [StageOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageOrderItemDto)
  stageOrders!: StageOrderItemDto[];
}
