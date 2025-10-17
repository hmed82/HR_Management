import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SimpleDepartmentDto {
    @Expose()
    @ApiProperty({
        example: 1,
        description: 'Department unique identifier',
    })
    id: number;

    @Expose()
    @ApiProperty({
        example: 'Engineering',
        description: 'Department name',
    })
    name: string;
}

// class SimpleManagerDto {
//     @Expose()
//   @ApiProperty({
//     example: 'Handles all software development and technical operations',
//     description: 'Department description',
//     required: false,
//   })
//     id: number;

//     @Expose()
//   @ApiProperty({
//     example: 'Handles all software development and technical operations',
//     description: 'Department description',
//     required: false,
//   })
//     firstName: string;

//     @Expose()
//   @ApiProperty({
//     example: 'Handles all software development and technical operations',
//     description: 'Department description',
//     required: false,
//   })
//     lastName: string;
// }

export class EmployeeDto {
    @Expose()
    @ApiProperty({
        example: 1,
        description: 'Employee unique identifier',
    })
    id: number;

    @Expose()
    @ApiProperty({
        example: 'John',
        description: 'Employee first name',
        required: false,
    })
    firstName?: string;

    @Expose()
    @ApiProperty({
        example: 'Doe',
        description: 'last first name',
        required: false,
    })
    lastName?: string;

    @Expose()
    @ApiProperty({
        example: 'user@example.com',
        description: 'Employee email address',
        required: false,
    })
    email?: string;

    @Expose()
    @ApiProperty({
        example: '0550 00 00 00',
        description: 'Employee phone number',
        required: false,
    })
    phone?: string;

    @Expose()
    @ApiProperty({
        example: '2025-10-09T10:30:00.000Z',
        description: 'Employee recrutment date',
        required: false,
    })
    hireDate?: Date;

    @Expose()
    @ApiProperty({
        example: 1,
        description: 'Department id that employee belongs to',
        required: false,
    })
    departmentId?: number;

    @Expose()
    @Type(() => SimpleDepartmentDto)
    @ApiProperty({
        description: 'Department that the employee belongs to',
        type: SimpleDepartmentDto
    })
    department?: SimpleDepartmentDto;

    // ************** i will add this functionality late **************
    // @Expose()
    // @ApiProperty()
    // managerId: number;

    // @Expose()
    // @Type(() => SimpleManagerDto)
    // @ApiProperty({ type: SimpleManagerDto, required: false })
    // manager: SimpleManagerDto;
    // ****************************************************************

    @Expose()
    @ApiProperty({
        example: '2025-10-14T10:30:00.000Z',
        description: 'Employee creation timestamp',
    })
    createdAt: Date;

    @Expose()
    @ApiProperty({
        example: '2025-10-14T10:30:00.000Z',
        description: 'Employee last update timestamp',
    })
    updatedAt: Date;

}