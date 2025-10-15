import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDepartmentDto } from '@/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/departments/dto/update-department.dto';
import { Department } from '@/departments/entities/department.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentsRepo: Repository<Department>,
  ) { }

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const { name, description } = createDepartmentDto;

    const existingDepartment = await this.findByName(name);
    if (existingDepartment) {
      throw new ConflictException('Department exists already');
    }

    const department = this.departmentsRepo.create({ name, description });
    return await this.departmentsRepo.save(department);
  }

  findAll(): Promise<Department[]> {
    return this.departmentsRepo.find();
  }

  async findByName(name: string): Promise<Department | null> {
    const department = await this.departmentsRepo.findOne({ where: { name } });
    return department;
  }

  async findById(id: number): Promise<Department | null> {
    const department = await this.departmentsRepo.findOne({ where: { id } });
    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
      const existingDepartment = await this.findByName(updateDepartmentDto.name);
      if (existingDepartment) {
        throw new ConflictException(
          `Department with name "${updateDepartmentDto.name}" already exists`,
        );
      }
    }

    Object.assign(department, updateDepartmentDto);
    return this.departmentsRepo.save(department);
  }

  async remove(id: number): Promise<string> {
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    // ****Check if department has employees linked to it

    // if (department.employees && department.employees.length > 0) {
    //   throw new BadRequestException(
    //     `Cannot delete department. ${department.employees.length} employee(s) are assigned to this department. Please reassign or remove them first.`,
    //   );
    // }


    // ****Check if department has employees linked to it
    // ****Uncomment and import BadRequestException where you create employee entity and add it in department entity

    // const deptWithEmployees = await this.findOneWithEmployees(id)
    // if (deptWithEmployees.employees && deptWithEmployees.employees.length > 0) {
    //   throw new BadRequestException(
    //     `Cannot delete department. ${deptWithEmployees.employees.length} employee(s) are assigned to this department. Please reassign or remove them first.`,
    //   );
    // }

    await this.departmentsRepo.remove(department);
    return 'Department successfully deleted';
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

  async findOneWithActiveEmployees(id: number): Promise<Department> {
    const department = await this.departmentsRepo
      .createQueryBuilder('dept')
      .leftJoinAndSelect('dept.employees', 'employee', 'employee.isActive = :active', {
        active: true,
      })
      .where('dept.id = :id', { id })
      .getOne();

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async findAllWithEmployeeCount(): Promise<Department[]> {
    return this.departmentsRepo
      .createQueryBuilder('dept')
      .loadRelationCountAndMap('dept.employeeCount', 'dept.employees')
      .getMany();
  }

  // async findAllWithEmployeeCount(): Promise<Array<Department & { employeeCount: number }>> {
  //   return this.departmentsRepo
  //     .createQueryBuilder('dept')
  //     .loadRelationCountAndMap('dept.employeeCount', 'dept.employees')
  //     .getMany() as Promise<Array<Department & { employeeCount: number }>>;
  // }
}
