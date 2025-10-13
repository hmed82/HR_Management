import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@/users/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(255, { message: 'Email must not exceed 255 characters' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(72, { message: 'Password must not exceed 72 characters' })
  // Simple rule (development)
  @Matches(/^(?=.*[a-z])(?=.*\d).*$/, {
    message:
      'Password must contain at least one lowercase letter and one number',
  })
  // For production (uncomment for stricter rule)
  // @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/, {
  //   message:
  //     'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character',
  // })
  password: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'User full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: UserRole.USER,
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional() // allow backend to assign default
  @IsString()
  @Matches(new RegExp(`^(${UserRole.ADMIN}|${UserRole.USER})$`), {
    message: 'Role must be either "admin" or "user"',
  })
  role: UserRole = UserRole.USER;
}
