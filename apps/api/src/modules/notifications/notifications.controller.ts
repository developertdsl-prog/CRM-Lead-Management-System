import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUserPayload } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@crm/shared-types';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Get current user notifications and unread badge count' })
  @ApiResponse({ status: 200, description: 'Notification items with unread count' })
  async findAll(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.notificationsService.findAll(user.organizationId, user.userId);
  }

  @Post()
  @Roles(UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Create a notification' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  async create(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(user.organizationId, user.userId, dto);
  }

  @Patch(':id/read')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification updated' })
  async markAsRead(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(user.organizationId, user.userId, id);
  }

  @Post('mark-all-read')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: AuthenticatedUserPayload) {
    return this.notificationsService.markAllAsRead(user.organizationId, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.READ_ONLY, UserRole.SALES_REP, UserRole.MANAGER, UserRole.ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async delete(
    @CurrentUser() user: AuthenticatedUserPayload,
    @Param('id') id: string,
  ) {
    return this.notificationsService.delete(user.organizationId, user.userId, id);
  }
}
