import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
  membershipId: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUserPayload | undefined;
    return data && user ? user[data] : user;
  },
);
