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
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { EmployeesService } from '@/employees/employees.service';
import { CreateEmployeeDto } from '@/employees/dto/create-employee.dto';
import { UpdateEmployeeDto } from '@/employees/dto/update-employee.dto';
import { EmployeeDto } from '@/employees/dto/employee.dto';
import { Employee } from '@/employees/entities/employee.entity';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/enums/user-role.enum';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { Paginate, Paginated } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({ summary: 'Create a new employee (Admin only)' })
  @ApiCreatedResponse({
    description: 'Employee successfully created',
    type: EmployeeDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Employee email already exists' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Serialize(EmployeeDto)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<Employee> {
    return this.employeesService.create(createEmployeeDto);
  }

  @ApiOperation({ summary: 'Get employee statistics (Admin only)' })
  @ApiOkResponse({
    description: 'Employee statistics retrieved successfully',
    schema: {
      example: {
        total: 150,
        active: 142,
        inactive: 8,
        byDepartment: [
          { departmentId: 1, departmentName: 'Engineering', count: 50 },
          { departmentId: 2, departmentName: 'Sales', count: 40 },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Get('stats/overview')
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDepartment: Array<{
      departmentId: number;
      departmentName: string;
      count: number;
    }>;
  }> {
    return this.employeesService.getStatistics();
  }

  @ApiOperation({ summary: 'Get employees by department (paginated)' })
  @ApiOkResponse({
    description:
      'Employees in department retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<EmployeeDto>,
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(EmployeeDto)
  @Get('department/:departmentId')
  findByDepartment(
    @Param('departmentId', ParseIntPipe) departmentId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Employee>> {
    return this.employeesService.findByDepartment(departmentId, query);
  }

  @ApiOperation({ summary: 'Get all employees (paginated)' })
  @ApiOkResponse({
    description:
      'Employees retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<EmployeeDto>,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(EmployeeDto)
  @Get()
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Employee>> {
    return this.employeesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get employee with department details' })
  @ApiOkResponse({
    description: 'Employee with department retrieved successfully',
    type: EmployeeDto,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(EmployeeDto)
  @Get(':id/department')
  findOneWithDepartment(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Employee> {
    return this.employeesService.findOneWithDepartment(id);
  }

  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiOkResponse({
    description: 'Employee found successfully',
    type: EmployeeDto,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(EmployeeDto)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Employee> {
    return this.employeesService.findById(id);
  }

  @ApiOperation({ summary: 'Update employee (Admin only)' })
  @ApiOkResponse({
    description: 'Employee successfully updated',
    type: EmployeeDto,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already exists' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<Employee> {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @ApiOperation({ summary: 'Delete employee (Admin only)' })
  @ApiOkResponse({ description: 'Employee successfully deleted' })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.employeesService.delete(id);
  }
}
