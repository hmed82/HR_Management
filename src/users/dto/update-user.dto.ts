import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/**
 * Non-admin users updating their own profile may only change their name and
 * password. `role`, `isActive` (and `email`) are intentionally stripped from
 * this DTO so a regular user cannot escalate their own privileges through
 * PATCH /users/:id.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'role', 'isActive'] as const),
) {}

/**
 * Admins updating any user may additionally change `role` and `isActive`.
 */
export class UpdateUserByAdminDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {}
