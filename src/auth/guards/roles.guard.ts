import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  //  Check if route requires specific roles
  canActivate(context: ExecutionContext): boolean {
    //  READ the metadata attached by @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY, // What metadata key to look for
      [
        context.getHandler(), // Check: Does the METHOD have @Public()?
        context.getClass(), // Check: Does the CLASS have @Public()?
      ],
    );

    if (!requiredRoles) {
      return true; // No role requirement, allow
    }

    //  Get user from request (set by JwtAuthStrategy (validate (payload))  that's in request.user)
    const { user } = context.switchToHttp().getRequest();

    //  Check if user has required role (request.user.role)
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return true;
  }
}
