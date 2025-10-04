import { IsEmail, IsString, MinLength, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    @MaxLength(255)
    email: string;

    @ApiProperty({ example: 'Password123!', description: 'User password' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @MaxLength(50)
    // ********************For development (simple rule)**********
    @Matches(/^(?=.*[a-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one lowercase letter and one number',
    })
    // ********************For production (stricter rule)**********
    // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/, {
    //     message:
    //         'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
    // })
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'User full name', required: false })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(100)
    name?: string;

    @ApiProperty({ example: 'user', description: 'User role', enum: ['admin', 'user'], default: 'user' })
    @IsString()
    @Matches(/^(admin|user)$/, { message: 'Role must be either "admin" or "user"' })
    role: string = 'user';
}