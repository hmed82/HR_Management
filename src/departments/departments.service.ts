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
    private readonly departementRepo: Repository<Department>,
  ) { }

  async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
    const { name, description } = createDepartmentDto;

    const existingDepartement = await this.findByName(name);
    if (existingDepartement) {
      throw new ConflictException('Departement exists already');
    }

    const department = this.departementRepo.create({ name, description });
    return await this.departementRepo.save(department);
  }

  findAll() {
    return this.departementRepo.find();
  }

  async findByName(name: string): Promise<Department | null> {
    const department = await this.departementRepo.findOne({ where: { name } });
    return department;
  }

  async findById(id: number): Promise<Department | null> {
    const department = await this.departementRepo.findOne({ where: { id } });
    return department;
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException('Departement Not Found');
    }

    Object.assign(department, updateDepartmentDto);
    return this.departementRepo.save(department);
  }

  async remove(id: number): Promise<string> {
    const department = await this.findById(id);
    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check if department has employees linked to it
    // if (department.employees && department.employees.length > 0) {
    //   throw new BadRequestException(
    //     `Cannot delete department. ${department.employees.length} employee(s) are assigned to this department. Please reassign or remove them first.`,
    //   );
    // }
    await this.departementRepo.remove(department);
    return 'Department successfully deleted';
  }
}
