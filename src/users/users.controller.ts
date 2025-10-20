import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UsersService } from '@/users/users.service';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserDto } from '@/users/dto/user.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UserRole } from '@/users/enums/user-role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/users/decorators/current-user.decorator';
import type { JwtUser } from '@/users/decorators/current-user.decorator';
import { Paginate, Paginated } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { User } from '@/users/entities/user.entity';

@ApiTags('Users')
@Serialize(UserDto)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async getProfile(@CurrentUser() user: JwtUser): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only, paginated)' })
  @ApiOkResponse({
    description:
      'Users retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<UserDto>,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  async findAll(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAll(query);
  }

  @Get('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID (Admin or own profile)' })
  @ApiOkResponse({ description: 'User found successfully', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'You can only access your own profile' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtUser,
  ): Promise<User> {
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only access your own profile');
    }
    return this.usersService.findById(id);
  }

  @Patch('/:id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user information (Admin or own profile)',
  })
  @ApiOkResponse({ description: 'User successfully updated', type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already in use' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'You can only update your own profile' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
  ): Promise<User> {
    // TODO: Create a custom guard/policy for this authorization logic instead of duplicating
    if (user.role !== UserRole.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete('/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiOkResponse({ description: 'User successfully deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.remove(id);
  }
}
