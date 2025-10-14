// src/departments/dto/department.dto.ts

import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class DepartmentDto {
  @ApiProperty({
    example: 1,
    description: 'Department unique identifier',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'Engineering',
    description: 'Department name',
  })
  @Expose()
  name: string;

  @ApiProperty({
    example: 'Handles all software development and technical operations',
    description: 'Department description',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    example: '2025-10-14T10:30:00.000Z',
    description: 'Department creation timestamp',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2025-10-14T10:30:00.000Z',
    description: 'Department last update timestamp',
  })
  @Expose()
  updatedAt: Date;
}
