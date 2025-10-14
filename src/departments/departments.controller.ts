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
@Roles(UserRole.ADMIN)
@Controller('departments')
@Serialize(DepartmentDto)
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
  @Post()
  create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDepartmentDto);
  }

  @ApiOperation({ summary: 'Get all departments (Admin only)' })
  @ApiOkResponse({
    description: 'Departments retrieved successfully',
    type: [DepartmentDto],
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @ApiOperation({ summary: 'Get department by ID (Admin only)' })
  @ApiOkResponse({
    description: 'Department found successfully',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const department = await this.departmentsService.findById(id);
    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }
    return department;
  }

  @ApiOperation({ summary: 'Update department (Admin only)' })
  @ApiOkResponse({
    description: 'Department successfully updated',
    type: DepartmentDto,
  })
  @ApiNotFoundResponse({ description: 'Department not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
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
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.departmentsService.remove(id);
  }
}
