import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const SKIP_MUST_CHANGE_PASSWORD = 'skipMustChangePassword';

export const SkipMustChangePassword = () =>
  (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(SKIP_MUST_CHANGE_PASSWORD, true, descriptor.value);
    return descriptor;
  };

@Injectable()
class MustChangePasswordGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.get<boolean>(
      SKIP_MUST_CHANGE_PASSWORD,
      context.getHandler(),
    );
    if (skip) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return true;

    if (user.internalProfile?.mustChangePassword) {
      throw new HttpException(
        'You must change your password before accessing this resource',
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}

export default MustChangePasswordGuard;
