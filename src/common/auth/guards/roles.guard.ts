import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { get } from 'lodash';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!get(user, 'internalProfile.role.name')) {
      throw new HttpException(
        'Access denied: insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }

    const hasRole = requiredRoles.includes(get(user, 'internalProfile.role.name'));

    if (!hasRole) {
      throw new HttpException(
        'Access denied: insufficient permissions',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}

export default RolesGuard;
