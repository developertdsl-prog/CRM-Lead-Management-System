import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType, ActivityStatus, ActivityPriority } from '@crm/shared-types';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType, default: ActivityType.TASK })
  @IsEnum(ActivityType)
  type: ActivityType = ActivityType.TASK;

  @ApiProperty({ description: 'Activity title', example: 'Product Demo & Proposal Review' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Detailed notes or agenda' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ActivityStatus, default: ActivityStatus.PENDING })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({ enum: ActivityPriority, default: ActivityPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;

  @ApiPropertyOptional({ description: 'Due date / scheduled time in ISO format' })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiPropertyOptional({ description: 'User ID assigned to complete activity' })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Outcome or summary if completed' })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({ description: 'Call direction (INBOUND/OUTBOUND)' })
  @IsOptional()
  @IsString()
  callType?: string;

  @ApiPropertyOptional({ description: 'Online meeting URL (Zoom, Meet)' })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiPropertyOptional({ description: 'Physical meeting location or room' })
  @IsOptional()
  @IsString()
  location?: string;

  // Polymorphic entity links
  @ApiPropertyOptional({ description: 'Linked Lead ID' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Linked Contact ID' })
  @IsOptional()
  @IsString()
  contactId?: string;

  @ApiPropertyOptional({ description: 'Linked Company ID' })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Linked Deal ID' })
  @IsOptional()
  @IsString()
  dealId?: string;
}
