import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationTypeEnum {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
  ALERT = 'ALERT',
}

export class CreateNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification message body' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ enum: NotificationTypeEnum, default: NotificationTypeEnum.INFO })
  @IsEnum(NotificationTypeEnum)
  @IsOptional()
  type?: NotificationTypeEnum;

  @ApiPropertyOptional({ description: 'Optional target URL/path to navigate to' })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ description: 'Target user ID (defaults to current user if omitted)' })
  @IsString()
  @IsOptional()
  userId?: string;
}
