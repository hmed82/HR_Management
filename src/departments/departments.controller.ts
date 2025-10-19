import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { DepartmentsService } from '@/departments/departments.service';
import { CreateDepartmentDto } from '@/departments/dto/create-department.dto';
import { UpdateDepartmentDto } from '@/departments/dto/update-department.dto';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/enums/user-role.enum';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { DepartmentDto } from '@/departments/dto/department.dto';
import { Department } from '@/departments/entities/department.entity';
import { Paginate, Paginated } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

@ApiTags('Departments')
@ApiBearerAuth()
@Serialize(DepartmentDto)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @ApiOperation({ summary: 'Create a new department (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Department successfully created',
    type: DepartmentDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Department name already exists' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Post()
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.create(createDepartmentDto);
  }

  @ApiOperation({ summary: 'Get all departments with employee count (paginated)' })
  @ApiOkResponse({
    description: 'Departments with employee count retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<DepartmentDto>,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get('employee-count')
  async getAllDepartmentsWithEmployeeCount(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Department>> {
    return this.departmentsService.findAllWithEmployeeCount(query);
  }

  @ApiOperation({ summary: 'Get all departments (paginated)' })
  @ApiOkResponse({
    description: 'Departments retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<DepartmentDto>,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get()
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Department>> {
    return this.departmentsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get department by ID' })
  @ApiOkResponse({
    description: 'Department found successfully',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Department> {
    return this.departmentsService.findById(id);
  }

  @ApiOperation({ summary: 'Update department (Admin only)' })
  @ApiOkResponse({
    description: 'Department successfully updated',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Department name already exists' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    return this.departmentsService.update(id, updateDepartmentDto);
  }

  @ApiOperation({ summary: 'Delete department (Admin only)' })
  @ApiOkResponse({ description: 'Department successfully deleted' })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiBadRequestResponse({
    description: 'Cannot delete department with assigned employees',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.departmentsService.remove(id);
  }
}