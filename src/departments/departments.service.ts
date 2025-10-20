import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from '@/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/departments/dto/update-department.dto';
import { Department } from '@/departments/entities/department.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginateQuery,
  paginate,
  Paginated,
  FilterOperator,
} from 'nestjs-paginate';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepo: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const { name, description } = createDepartmentDto;

    const existingDepartment = await this.departmentsRepo.findOne({
      where: { name },
    });
    if (existingDepartment) {
      throw new ConflictException('Department exists already');
    }

    const department = this.departmentsRepo.create({ name, description });
    return await this.departmentsRepo.save(department);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<Department>> {
    return paginate(query, this.departmentsRepo, {
      sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
      searchableColumns: ['name', 'description'],
      filterableColumns: {
        name: [FilterOperator.EQ, FilterOperator.ILIKE],
      },
      defaultSortBy: [['id', 'ASC']],
      defaultLimit: 10,
      maxLimit: 100,
    });
  }

  async findByName(name: string): Promise<Department | null> {
    const department = await this.departmentsRepo.findOne({ where: { name } });
    return department;
  }

  async findById(id: number): Promise<Department> {
    const department = await this.departmentsRepo.findOne({ where: { id } });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findById(id);

    if (
      // I am using this piece of code elsewhere, maybe refactor it later
      updateDepartmentDto.name &&
      updateDepartmentDto.name !== department.name
    ) {
      const existingDepartment = await this.departmentsRepo.findOne({
        where: { name: updateDepartmentDto.name },
      });
      if (existingDepartment) {
        throw new ConflictException(
          `Department with name "${updateDepartmentDto.name}" already exists`,
        );
      }
    }

    Object.assign(department, updateDepartmentDto);
    return this.departmentsRepo.save(department);
  }

  async remove(id: number): Promise<void> {
    const department = await this.findById(id);

    // Check if department has employees linked to it
    const deptWithEmployees = await this.findOneWithEmployees(id);
    if (deptWithEmployees.employees && deptWithEmployees.employees.length > 0) {
      throw new BadRequestException(
        `Cannot delete department. ${deptWithEmployees.employees.length} employee(s) are assigned to this department. Please reassign or remove them first.`,
      );
    }

    await this.departmentsRepo.remove(department);
  }

  async findOneWithEmployees(id: number): Promise<Department> {
    const department = await this.departmentsRepo.findOne({
      where: { id },
      relations: ['employees'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  // // Alternative with explicit type if you want to expose employeeCount in the type
  // async findAllWithEmployeeCount1(): Promise<Array<Department & { employeeCount: number }>> {
  //   return this.departmentsRepo
  //     .createQueryBuilder('dept')
  //     .loadRelationCountAndMap('dept.employeeCount', 'dept.employees')
  //     .getMany() as Promise<Array<Department & { employeeCount: number }>>;
  // }

  async findAllWithEmployeeCount1(): Promise<Department[]> {
    return this.departmentsRepo
      .createQueryBuilder('dept')
      .loadRelationCountAndMap('dept.employeeCount', 'dept.employees')
      .getMany();
  }

  async findAllWithEmployeeCount(
    query: PaginateQuery,
  ): Promise<Paginated<Department>> {
    // Create query builder with employee count
    const queryBuilder = this.departmentsRepo
      .createQueryBuilder('dept')
      .loadRelationCountAndMap('dept.employeeCount', 'dept.employees');

    // Use paginate with the custom query builder
    return paginate(query, queryBuilder, {
      sortableColumns: ['id', 'name', 'createdAt', 'updatedAt'],
      searchableColumns: ['name', 'description'],
      filterableColumns: {
        name: [FilterOperator.EQ, FilterOperator.ILIKE],
      },
      defaultSortBy: [['id', 'ASC']],
      defaultLimit: 10,
      maxLimit: 100,
    });
  }
}
