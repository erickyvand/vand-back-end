import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import PrismaService from '../../../prisma/prisma.service';
import { JWT_SECRET } from '../../constant.common';

@Injectable()
class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET as string,
    });
  }

  async validate(payload: { sub: string; email: string; userType: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      include: {
        internalProfile: true,
        externalProfile: true,
      },
    });

    if (!user) {
      throw new HttpException('User no longer exists', HttpStatus.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new HttpException('Account is deactivated', HttpStatus.FORBIDDEN);
    }

    if (user.userType === 'Internal' && user.internalProfile?.isSuspended) {
      throw new HttpException('Account is suspended', HttpStatus.FORBIDDEN);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default JwtStrategy;
