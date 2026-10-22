import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole, MembershipStatus } from '@crm/shared-types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    const slug =
      dto.organizationSlug ||
      dto.organizationName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') +
        '-' +
        Math.floor(1000 + Math.random() * 9000);

    const saltRounds = Number(this.configService.get('PASSWORD_HASH_ROUNDS')) || 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
          currency: 'USD',
          timezone: 'UTC',
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          isActive: true,
          isEmailVerified: true,
        },
      });

      const membership = await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: UserRole.OWNER,
          jobTitle: 'Founder / Administrator',
          status: MembershipStatus.ACTIVE,
        },
      });

      // Default pipeline for the new organization
      await tx.pipeline.create({
        data: {
          organizationId: organization.id,
          name: 'Standard Sales Pipeline',
          isDefault: true,
          stages: {
            create: [
              { name: 'Lead Qualified', order: 1, winProbability: 15, color: '#3B82F6' },
              { name: 'Discovery & Demo', order: 2, winProbability: 40, color: '#8B5CF6' },
              { name: 'Proposal Sent', order: 3, winProbability: 70, color: '#F59E0B' },
              { name: 'Closed Won', order: 4, winProbability: 100, color: '#10B981' },
              { name: 'Closed Lost', order: 5, winProbability: 0, color: '#EF4444' },
            ],
          },
        },
      });

      const tokens = await this.generateTokens(user.id, user.email, organization.id, membership.role, membership.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        role: membership.role,
        tokens,
      };
    });
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
      include: {
        memberships: {
          include: { organization: true },
          where: { status: MembershipStatus.ACTIVE },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.memberships.length === 0) {
      throw new UnauthorizedException('User account has no active organization memberships');
    }

    const primaryMembership = user.memberships[0];

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      primaryMembership.organizationId,
      primaryMembership.role,
      primaryMembership.id,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      organization: {
        id: primaryMembership.organization.id,
        name: primaryMembership.organization.name,
        slug: primaryMembership.organization.slug,
      },
      role: primaryMembership.role,
      tokens,
    };
  }

  async refreshToken(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            memberships: {
              where: { status: MembershipStatus.ACTIVE },
              include: { organization: true },
            },
          },
        },
      },
    });

    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is expired or revoked');
    }

    // Revoke old token on reuse (Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const user = storedToken.user;
    if (!user || user.memberships.length === 0) {
      throw new UnauthorizedException('User has no active organizations');
    }

    const activeMembership = user.memberships[0];

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      activeMembership.organizationId,
      activeMembership.role,
      activeMembership.id,
    );

    return {
      tokens,
      role: activeMembership.role,
      organization: {
        id: activeMembership.organization.id,
        name: activeMembership.organization.name,
        slug: activeMembership.organization.slug,
      },
    };
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
      await this.prisma.refreshToken.updateMany({
        where: { userId, tokenHash },
        data: { isRevoked: true },
      });
    } else {
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true },
      });
    }

    return { message: 'Successfully logged out' };
  }

  private async generateTokens(
    userId: string,
    email: string,
    organizationId: string,
    role: string,
    membershipId: string,
  ) {
    const payload = { sub: userId, email, orgId: organizationId, role, membershipId };

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get('JWT_ACCESS_SECRET') ||
        'crm_jwt_access_secret_super_secure_random_key_min_32_chars_long_12345',
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins
    };
  }
}
