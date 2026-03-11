import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { sumBy, find } from 'lodash';
import PrismaService from '../../prisma/prisma.service';
import Argon from '../../argon/argon';
import LoggerService from '../../logger/logger.service';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} from '../constant.common';

const logger = new LoggerService('auth');

@Injectable()
class AuthService {
  private readonly argon = new Argon();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string, ip: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      include: {
        internalProfile: true,
        externalProfile: true,
      },
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

    const payload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: (JWT_EXPIRATION || '15m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: JWT_REFRESH_SECRET,
      expiresIn: (JWT_REFRESH_EXPIRATION || '7d') as any,
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
        loginCount: { increment: 1 },
      },
    });

    logger.handleInfoLog(`User ${email} logged in successfully`);

    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: JWT_REFRESH_SECRET,
      });

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

      const payload = {
        sub: user.id,
        email: user.email,
        userType: user.userType,
      };

      const newAccessToken = this.jwtService.sign(payload, {
        secret: JWT_SECRET,
        expiresIn: (JWT_EXPIRATION || '15m') as any,
      });

      const newRefreshToken = this.jwtService.sign(payload, {
        secret: JWT_REFRESH_SECRET,
        expiresIn: (JWT_REFRESH_EXPIRATION || '7d') as any,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

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
            avatar: true,
            bio: true,
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
