import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateTimeEntryDto {
  @ApiProperty({ description: 'Employee ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  employeeId: number;

  @ApiProperty({ description: 'Date of entry', example: '2025-10-15' })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Clock-in time', example: '09:00:00' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'clockIn must be in HH:mm:ss format',
  })
  clockIn: string;

  @ApiProperty({
    description: 'Clock-out time',
    example: '17:30:00',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'clockOut must be in HH:mm:ss format',
  })
  clockOut?: string;
}
