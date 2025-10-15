import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
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

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @Serialize(DepartmentDto)
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
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @Serialize(DepartmentDto)
  @ApiOperation({ summary: 'Get all departments' })
  @ApiOkResponse({
    description: 'Departments retrieved successfully',
    type: [DepartmentDto],
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Serialize(DepartmentDto)
  @ApiOperation({ summary: 'Get all departments with employee count' })
  @ApiOkResponse({
    description: 'Departments with employee count retrieved successfully',
  })
  @ApiOkResponse({
    description: 'Departments with employee count retrieved successfully',
    type: [DepartmentDto],
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get('employee-count')
  async getAllDepartmentsWithEmployeeCount() {
    return this.departmentsService.findAllWithEmployeeCount()
  }


  @Serialize(DepartmentDto)
  @ApiOperation({ summary: 'Get department by ID' })
  @ApiOkResponse({
    description: 'Department found successfully',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const department = await this.departmentsService.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  @ApiOperation({ summary: 'Get department with all employees' })
  @ApiOkResponse({
    description: 'Department with employees retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get(':id/employees')
  async getDepartmentWithEmployees(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOneWithEmployees(id);
  }

  @ApiOperation({ summary: 'Get department with active employees only' })
  @ApiOkResponse({
    description: 'Department with active employees retrieved successfully',
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get(':id/active-employees')
  async getDepartmentWithActiveEmployees(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.findOneWithActiveEmployees(id);
  }

  @Serialize(DepartmentDto)
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
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
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
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }
}