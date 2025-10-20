import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEmployeeDto } from '@/employees/dto/create-employee.dto';
import { UpdateEmployeeDto } from '@/employees/dto/update-employee.dto';
import { Employee } from '@/employees/entities/employee.entity';
import {
  PaginateQuery,
  paginate,
  Paginated,
  FilterOperator,
} from 'nestjs-paginate';
import { DepartmentsService } from '@/departments/departments.service';

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
  ) { }

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

    const employee = this.employeesRepo.create({
      email,
      departmentId,
      ...rest,
    });

    return await this.employeesRepo.save(employee);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Employee>> {
    return paginate(query, this.employeesRepo, {
      sortableColumns: [
        'id',
        'firstName',
        'lastName',
        'email',
        'hireDate',
        'createdAt',
      ],
      searchableColumns: ['firstName', 'lastName', 'email'],
      filterableColumns: {
        departmentId: [FilterOperator.EQ],
        isActive: [FilterOperator.EQ],
      },
      defaultSortBy: [['id', 'ASC']],
      defaultLimit: 10,
      maxLimit: 100,
      relations: ['department'],
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

  async findByDepartment(
    departmentId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Employee>> {
    await this.departmentsService.findById(departmentId);

    const queryBuilder = this.employeesRepo
      .createQueryBuilder('employee')
      .where('employee.departmentId = :departmentId', { departmentId });

    return paginate(query, queryBuilder, {
      sortableColumns: [
        'id',
        'firstName',
        'lastName',
        'email',
        'hireDate',
        'createdAt',
      ],
      searchableColumns: ['firstName', 'lastName', 'email'],
      filterableColumns: {
        isActive: [FilterOperator.EQ],
      },
      defaultSortBy: [['id', 'ASC']],
      defaultLimit: 10,
      maxLimit: 100,
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return this.employeesRepo.findOne({ where: { email } });
  }

  async update(
    id: number,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    const employee = await this.findById(id);

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
    // If departmentId doestnt exist : departmentsService.findById throws NotFoundException
    if (updateEmployeeDto.departmentId) {
      await this.departmentsService.findById(updateEmployeeDto.departmentId);
    }

    Object.assign(employee, updateEmployeeDto);
    return this.employeesRepo.save(employee);
  }

  async delete(id: number): Promise<void> {
    const employee = await this.findById(id);
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
