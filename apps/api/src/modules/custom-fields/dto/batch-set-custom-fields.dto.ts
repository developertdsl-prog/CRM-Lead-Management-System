import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class BatchSetCustomFieldsDto {
  @ApiProperty({
    description: 'Dynamic key-value map matching custom fieldNames',
    example: { gstinNumber: '27AAAAA0000A1Z5', partnerType: 'Channel Partner' },
  })
  @IsObject()
  @IsNotEmpty()
  fields!: Record<string, unknown>;
}
