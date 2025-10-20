import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '@/users/enums/user-role.enum';

export interface JwtUser {
  id: number;
  role: UserRole;
  isActive: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: never, context: ExecutionContext): JwtUser | undefined => {
    const request = context.switchToHttp().getRequest();
    return request.user; // Get request.user set by JwtStrategy
  },
);
