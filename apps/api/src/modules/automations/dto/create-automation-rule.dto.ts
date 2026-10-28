import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AutomationTriggerEnum {
  LEAD_CREATED = 'LEAD_CREATED',
  LEAD_STATUS_CHANGED = 'LEAD_STATUS_CHANGED',
  LEAD_ASSIGNED = 'LEAD_ASSIGNED',
  DEAL_STAGE_CHANGED = 'DEAL_STAGE_CHANGED',
  TASK_OVERDUE = 'TASK_OVERDUE',
}

export class CreateAutomationRuleDto {
  @ApiProperty({ description: 'Name of the automation rule' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of rule function' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: AutomationTriggerEnum, description: 'Event trigger that activates this rule' })
  @IsEnum(AutomationTriggerEnum)
  triggerEvent: AutomationTriggerEnum;

  @ApiPropertyOptional({ description: 'Array of conditions to evaluate' })
  @IsOptional()
  conditions?: any;

  @ApiProperty({ description: 'Array of actions to execute' })
  @IsArray()
  actions: any[];

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
