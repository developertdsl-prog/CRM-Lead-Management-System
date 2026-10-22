import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddNoteDto {
  @ApiProperty({ description: 'Note content or conversation takeaway', example: 'Called lead, requested demo on Thursday at 3 PM' })
  @IsString()
  @IsNotEmpty()
  note!: string;
}
