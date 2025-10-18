import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { DepartmentsService } from '../departments/departments.service';

// Interface for statistics
export interface EmployeeStatistics {
  total: number;
  active: number;
  inactive: number;
  byDepartment: Array<{
    departmentId: number;
    departmentName: string;
    count: number;
  }>;
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepo: Repository<Employee>,
    private readonly departmentsService: DepartmentsService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const { email, departmentId, ...rest } = createEmployeeDto;

    if (email) {
      const existingEmployee = await this.employeesRepo.findOne({
        where: { email },
      });
      if (existingEmployee) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    //Check if department exists
    const department = await this.departmentsService.findById(departmentId);
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    const employee = this.employeesRepo.create({
      email,
      departmentId,
      ...rest,
    });

    return await this.employeesRepo.save(employee);
  }

  // using the nestjs-paginate package
  // check getall in employees module for the official NestJs Doc approach
  async findAll(query: PaginateQuery): Promise<Paginated<Employee>> {
    return paginate(query, this.employeesRepo, {
      sortableColumns: ['id'],
      defaultLimit: 10,
      maxLimit: 100,
    });
  }

  async findById(id: number): Promise<Employee> {
    const employee = await this.employeesRepo.findOne({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async findOneWithDepartment(id: number): Promise<Employee> {
    const employee = await this.employeesRepo.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async findByDepartment(departmentId: number): Promise<Employee[]> {
    return this.employeesRepo.find({
      where: { departmentId },
      relations: ['department'],
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.employeesRepo.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.employeesRepo.findOne({ where: { id } });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (updateEmployeeDto.email && updateEmployeeDto.email !== employee.email) {
      const existingEmployee = await this.employeesRepo.findOne({
        where: { email: updateEmployeeDto.email },
      });
      if (existingEmployee) {
        throw new ConflictException('Email already exists');
      }
    }

    // Verify department exists if being updated
    if (updateEmployeeDto.departmentId) {
      const department = await this.departmentsService.findById(
        updateEmployeeDto.departmentId,
      );
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${updateEmployeeDto.departmentId} not found`,
        );
      }
    }

    Object.assign(employee, updateEmployeeDto);
    return this.employeesRepo.save(employee);
  }

  //************************************************************************************************************** */

  async delete(id: number): Promise<void> {
    const employee = await this.employeesRepo.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    await this.employeesRepo.remove(employee);
  }

  async getStatistics(): Promise<EmployeeStatistics> {
    // Get employee count by department
    const byDepartment = await this.employeesRepo
      .createQueryBuilder('employee')
      .leftJoin('employee.department', 'department')
      .select('department.id', 'departmentId')
      .addSelect('department.name', 'departmentName')
      .addSelect('COUNT(employee.id)', 'count')
      .where('department.id IS NOT NULL') // Only count employees with departments
      .groupBy('department.id')
      .addGroupBy('department.name')
      .getRawMany();

    // const total = await this.employeesRepo.count();
    // const active = await this.employeesRepo.count({
    //   where: { isActive: true },
    // });
    // const inactive = total - active;

    // return {
    //   total,
    //   active,
    //   inactive,
    //   byDepartment: byDepartment.map((item) => ({
    //     departmentId: item.departmentId,
    //     departmentName: item.departmentName,
    //     count: parseInt(item.count, 10),
    //   })),
    // };

    // Single query to get all statistics
    const stats = await this.employeesRepo
      .createQueryBuilder('employee')
      .select([
        'COUNT(employee.id) as total',
        'SUM(CASE WHEN employee.isActive = true THEN 1 ELSE 0 END) as active',
        'SUM(CASE WHEN employee.isActive = false THEN 1 ELSE 0 END) as inactive',
      ])
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      active: parseInt(stats.active, 10) || 0,
      inactive: parseInt(stats.inactive, 10) || 0,
      byDepartment: byDepartment.map((item) => ({
        departmentId: parseInt(item.departmentId, 10),
        departmentName: item.departmentName,
        count: parseInt(item.count, 10),
      })),
    };
  }
}
