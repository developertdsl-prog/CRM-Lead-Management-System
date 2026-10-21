import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  orgId: string;
  role: string;
  membershipId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'crm_jwt_access_secret_super_secure_random_key_min_32_chars_long_12345',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          where: { organizationId: payload.orgId, status: 'ACTIVE' },
        },
      },
    });

    if (!user || !user.isActive || user.memberships.length === 0) {
      throw new UnauthorizedException('User account is invalid, inactive, or not part of this organization');
    }

    const activeMembership = user.memberships[0];

    return {
      userId: user.id,
      email: user.email,
      organizationId: activeMembership.organizationId,
      role: activeMembership.role,
      membershipId: activeMembership.id,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}
