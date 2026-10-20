import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    const { email, departmentId, managerId, ...rest } = createEmployeeDto;

    if (email) {
      const existingEmployee = await this.employeesRepo.findOne({
        where: { email },
      });
      if (existingEmployee) {
        throw new ConflictException('Employee with this email already exists');
      }
    }

    //Check if department exists (throws NotFoundException when missing)
    await this.departmentsService.findById(departmentId);

    // Check if manager exists
    if (managerId !== undefined && managerId !== null) {
      const manager = await this.findById(managerId);
      if (!manager || !manager.isActive) {
        throw new BadRequestException(`Manager with ID ${managerId} not found`);
      }
    }

    const employee = this.employeesRepo.create({
      email,
      departmentId,
      ...rest,
      managerId,
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
    const employee = await this.employeesRepo.findOne({
      where: { id },
      relations: ['manager'],
    });

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

    // Verify manager exists if being changed (also prevents self-management)
    if (
      updateEmployeeDto.managerId !== undefined &&
      updateEmployeeDto.managerId !== null &&
      updateEmployeeDto.managerId !== employee.managerId
    ) {
      if (updateEmployeeDto.managerId === id) {
        throw new BadRequestException(
          'An employee cannot be their own manager',
        );
      }
      await this.findById(updateEmployeeDto.managerId);
    }

    Object.assign(employee, updateEmployeeDto);
    return this.employeesRepo.save(employee);
  }

  /**
   * Get all employees that report to the given manager (paginated).
   * Verifies the manager exists first (throws NotFoundException otherwise).
   */
  async findSubordinates(
    managerId: number,
    query: PaginateQuery,
  ): Promise<Paginated<Employee>> {
    await this.findById(managerId);

    const queryBuilder = this.employeesRepo
      .createQueryBuilder('employee')
      .where('employee.managerId = :managerId', { managerId });

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
        departmentId: [FilterOperator.EQ],
        isActive: [FilterOperator.EQ],
      },
      defaultSortBy: [['id', 'ASC']],
      defaultLimit: 10,
      maxLimit: 100,
    });
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
    const stats = (await this.employeesRepo
      .createQueryBuilder('employee')
      .select([
        'COUNT(employee.id) as total',
        'SUM(CASE WHEN employee.isActive = true THEN 1 ELSE 0 END) as active',
        'SUM(CASE WHEN employee.isActive = false THEN 1 ELSE 0 END) as inactive',
      ])
      .getRawOne()) ?? { total: 0, active: 0, inactive: 0 };

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
