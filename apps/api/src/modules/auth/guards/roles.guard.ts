import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@crm/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: User role could not be verified');
    }

    // Role hierarchy mapping
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.OWNER]: 100,
      [UserRole.ADMIN]: 80,
      [UserRole.MANAGER]: 60,
      [UserRole.SALES_REP]: 40,
      [UserRole.READ_ONLY]: 20,
    };

    const userRoleWeight = roleHierarchy[user.role as UserRole] || 0;
    const hasRole = requiredRoles.some((role) => userRoleWeight >= (roleHierarchy[role] || 0));

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient permissions: Required roles [${requiredRoles.join(', ')}], current role is ${user.role}`,
      );
    }

    return true;
  }
}
