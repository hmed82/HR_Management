import { UserRole } from '@/users/enums/user-role.enum';

export type JwtUser = {
    id: string;
    role: UserRole;
    isActive: boolean;
};