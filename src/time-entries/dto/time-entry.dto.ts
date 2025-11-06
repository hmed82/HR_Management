import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { EmployeeDto } from '@/employees/dto/employee.dto';
import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

export class TimeEntryDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  employeeId: number;

  @ApiProperty()
  @Expose()
  date: Date;

  @ApiProperty()
  @Expose()
  clockIn: string;

  @ApiProperty({ nullable: true })
  @Expose()
  clockOut: string | null;

  @ApiProperty({ enum: TimeEntryStatus })
  @Expose()
  status: TimeEntryStatus;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty() @Expose() updatedAt: Date;
  @ApiProperty({ type: () => EmployeeDto, required: false })
  @Expose()
  @Type(() => EmployeeDto)
  employee?: EmployeeDto;
}
