import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsEmail,
    IsOptional,
    IsInt,
    IsDateString,
    MinLength,
    MaxLength,
    Matches,
    IsBoolean,
} from 'class-validator';

export class CreateEmployeeDto {
    @ApiProperty({
        example: 'John',
        description: 'Employee first name',
    })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: 'Employee last name',
    })
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    lastName: string;

    @ApiProperty({
        example: 'john.doe@example.com',
        description: 'Employee email address',
        required: false,
    })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({
        example: '0550000000',
        description: 'Employee phone number',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Matches(/^0[5-7][0-9]{8}$/, {
        message: 'Phone number must be a valid Algerian phone number (e.g., 0550000000)',
    })
    phone?: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Employee active status',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({
        example: '2025-10-09T10:30:00.000Z',
        description: 'Employee recruitment date',
        required: false,
    })
    @IsOptional()
    @IsDateString()
    hireDate?: string;

    @ApiProperty({
        example: 1,
        description: 'Department ID that employee belongs to',
    })
    @IsInt()
    departmentId: number;
}