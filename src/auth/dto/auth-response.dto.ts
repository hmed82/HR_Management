import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/users/enums/user-role.enum';

/**
 * Shape returned by POST /auth/register, POST /auth/login
 * and POST /auth/refresh.
 */
export class AuthResponseDto {
  @ApiProperty({
    description:
      'Short-lived JWT access token. Send it as `Authorization: Bearer <access_token>` on every request.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description:
      'Long-lived refresh token. Send it to POST /auth/refresh to obtain new tokens.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Minimal information about the authenticated user',
    example: { id: 1, email: 'user@example.com', role: UserRole.ADMIN },
  })
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}
