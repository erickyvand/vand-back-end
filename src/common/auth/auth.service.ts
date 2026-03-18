import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { sumBy, find } from 'lodash';
import PrismaService from '../../prisma/prisma.service';
import Argon from '../../argon/argon';
import LoggerService from '../../logger/logger.service';
import MailService from '../mail/mail.service';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} from '../constant.common';

const logger = new LoggerService('auth');

const OTP_EXPIRY_MINUTES = 10;

@Injectable()
class AuthService {
  private readonly argon = new Argon();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private signTempToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, purpose: '2fa' },
      { secret: JWT_SECRET, expiresIn: `${OTP_EXPIRY_MINUTES}m` as any },
    );
  }

  private verifyTempToken(token: string): string {
    try {
      const decoded = this.jwtService.verify(token, { secret: JWT_SECRET });
      if (decoded.purpose !== '2fa') {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      return decoded.sub;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
    }
  }

  private issueTokens(user: { id: string; email: string; userType: string }) {
    const payload = { sub: user.id, email: user.email, userType: user.userType };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: JWT_SECRET,
        expiresIn: (JWT_EXPIRATION || '15m') as any,
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: JWT_REFRESH_SECRET,
        expiresIn: (JWT_REFRESH_EXPIRATION || '7d') as any,
      }),
    };
  }

  async login(email: string, password: string, ip: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: { internalProfile: true, externalProfile: true },
    });

    if (!user) {
      logger.handleErrorLog(`Login failed: user not found for email ${email}`);
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await this.argon.verifyPassword(user.password, password);
    if (!isPasswordValid) {
      logger.handleErrorLog(`Login failed: invalid password for email ${email}`);
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }

    if (!user.isActive) {
      logger.handleErrorLog(`Login failed: inactive account for email ${email}`);
      throw new HttpException('Account is deactivated', HttpStatus.FORBIDDEN);
    }

    if (user.userType === 'Internal' && user.internalProfile?.isSuspended) {
      logger.handleErrorLog(`Login failed: suspended account for email ${email}`);
      throw new HttpException(
        `Account is suspended: ${user.internalProfile.suspendedReason || 'No reason provided'}`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (user.userType === 'Internal' && user.internalProfile?.twoFactorEnabled) {
      const otp = this.generateOtp();
      const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      await this.prismaService.internalProfile.update({
        where: { userId: user.id },
        data: { twoFactorOtp: otp, twoFactorOtpExpiry: expiry },
      });

      await this.mailService.send({
        to: { email: user.email, name: user.fullName },
        subject: 'Your verification code',
        htmlContent: `
          <p>Hi ${user.fullName},</p>
          <p>Your verification code is:</p>
          <h2 style="letter-spacing:4px">${otp}</h2>
          <p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      logger.handleInfoLog(`2FA OTP sent to ${email}`);
      return {
        twoFactorRequired: true,
        tempToken: this.signTempToken(user.id),
      };
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ip, loginCount: { increment: 1 } },
    });

    logger.handleInfoLog(`User ${email} logged in successfully`);

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...this.issueTokens(user),
      mustChangePassword: user.internalProfile?.mustChangePassword ?? false,
      user: userWithoutPassword,
    };
  }

  async verifyTwoFactor(tempToken: string, otp: string, ip: string) {
    const userId = this.verifyTempToken(tempToken);

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { internalProfile: true, externalProfile: true },
    });

    if (!user || !user.internalProfile) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const profile = user.internalProfile;

    if (!profile.twoFactorOtp || !profile.twoFactorOtpExpiry) {
      throw new HttpException('No OTP requested', HttpStatus.BAD_REQUEST);
    }

    if (new Date() > profile.twoFactorOtpExpiry) {
      throw new HttpException('OTP has expired', HttpStatus.UNAUTHORIZED);
    }

    if (profile.twoFactorOtp !== otp) {
      throw new HttpException('Invalid OTP', HttpStatus.UNAUTHORIZED);
    }

    await this.prismaService.internalProfile.update({
      where: { userId },
      data: { twoFactorOtp: null, twoFactorOtpExpiry: null },
    });

    await this.prismaService.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date(), lastLoginIp: ip, loginCount: { increment: 1 } },
    });

    logger.handleInfoLog(`2FA verified for user ${user.email}`);

    const { password: _, ...userWithoutPassword } = user;
    return {
      ...this.issueTokens(user),
      mustChangePassword: user.internalProfile?.mustChangePassword ?? false,
      user: userWithoutPassword,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { internalProfile: true },
    });

    if (!user || !user.internalProfile) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await this.argon.verifyPassword(user.password, currentPassword);
    if (!isPasswordValid) {
      throw new HttpException('Current password is incorrect', HttpStatus.UNAUTHORIZED);
    }

    if (currentPassword === newPassword) {
      throw new HttpException('New password must be different from current password', HttpStatus.BAD_REQUEST);
    }

    const hashed = await this.argon.hashPassword(newPassword);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    const activeTerms = await this.prismaService.terms.findFirst({ where: { isActive: true } });
    if (!activeTerms) {
      throw new HttpException(
        'No active terms and conditions available. Please contact your administrator.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    await this.prismaService.internalProfile.update({
      where: { userId },
      data: {
        mustChangePassword: false,
        lastPasswordChange: new Date(),
        termsAcceptedAt: new Date(),
        termsVersion: activeTerms.version,
      },
    });

    logger.handleInfoLog(`Password changed for user ${user.email}`);
  }

  async updateProfile(userId: string, data: { displayName?: string; avatar?: string; bio?: string; xLink?: string; linkedinLink?: string }) {
    const profile = await this.prismaService.internalProfile.findUnique({ where: { userId } });
    if (!profile) throw new HttpException('Profile not found', HttpStatus.NOT_FOUND);

    return this.prismaService.internalProfile.update({
      where: { userId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.xLink !== undefined && { xLink: data.xLink }),
        ...(data.linkedinLink !== undefined && { linkedinLink: data.linkedinLink }),
      },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        bio: true,
        xLink: true,
        linkedinLink: true,
        updatedAt: true,
      },
    });
  }

  async getActiveTerms() {
    const terms = await this.prismaService.terms.findFirst({ where: { isActive: true } });
    if (!terms) throw new HttpException('No active terms found', HttpStatus.NOT_FOUND);
    return terms;
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, { secret: JWT_REFRESH_SECRET });

      const user = await this.prismaService.user.findUnique({
        where: { id: decoded.sub },
        include: { internalProfile: true },
      });

      if (!user || !user.isActive) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      if (user.userType === 'Internal' && user.internalProfile?.isSuspended) {
        throw new HttpException('Account is suspended', HttpStatus.FORBIDDEN);
      }

      return this.issueTokens(user);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      const err = error as Error;
      logger.handleErrorLog('Refresh token validation failed', err.message);

      if (err.name === 'TokenExpiredError') {
        throw new HttpException('Refresh token has expired, please login again', HttpStatus.UNAUTHORIZED);
      }
      if (err.name === 'JsonWebTokenError') {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException('Could not process refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  async getMe(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        slug: true,
        email: true,
        phone: true,
        userType: true,
        createdAt: true,
        internalProfile: {
          select: {
            id: true,
            role: true,
            displayName: true,
            avatar: true,
            bio: true,
            xLink: true,
            linkedinLink: true,
            twoFactorEnabled: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const authorId = user.internalProfile?.id;
    const stats = authorId
      ? await this.prismaService.article.groupBy({
          by: ['status'],
          where: { authorId, deletedAt: null },
          _count: true,
        })
      : [];

    const articleStats = {
      total: sumBy(stats, '_count'),
      draft: find(stats, ['status', 'Draft'])?._count || 0,
      published: find(stats, ['status', 'Published'])?._count || 0,
      inReview: find(stats, ['status', 'InReview'])?._count || 0,
      rejected: find(stats, ['status', 'Rejected'])?._count || 0,
      archived: find(stats, ['status', 'Archived'])?._count || 0,
    };

    return { ...user, articleStats };
  }
}

export default AuthService;
