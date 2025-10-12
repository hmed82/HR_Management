import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@/users/enums/user-role.enum';

export class UserDto {

    @ApiProperty({
        example: 1,
        description: 'User unique identifier',
    })
    @Expose()
    id: number;

    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @Expose()
    email: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'User full name',
        required: false,
    })
    @Expose()
    name?: string;

    @ApiProperty({
        example: true,
        description: 'Is user Active',
        required: false,
    })
    @Expose()
    isActive: boolean;

    @ApiProperty({
        example: UserRole.USER,
        description: 'User role',
        enum: UserRole,
    })
    @Expose()
    role: UserRole;

    @ApiProperty({
        example: '2025-10-09T10:30:00.000Z',
        description: 'Account creation timestamp',
    })
    @Expose()
    createdAt: Date;

    @ApiProperty({
        example: '2025-10-09T10:30:00.000Z',
        description: 'Account last update timestamp',
    })
    @Expose()
    updatedAt: Date;
}