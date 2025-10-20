import { Module } from '@nestjs/common';
import { EmployeesService } from '@/employees/employees.service';
import { EmployeesController } from '@/employees/employees.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from '@/employees/entities/employee.entity';
import { DepartmentsModule } from '@/departments/departments.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee]), DepartmentsModule],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
