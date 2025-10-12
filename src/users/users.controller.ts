import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBearerAuth, ApiResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UsersService } from '@/users/users.service';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserDto } from '@/users/dto/user.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UserRole } from '@/users/enums/user-role.enum';
import { User } from '@/users/entities/user.entity'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';


@ApiTags('Users')
@Controller('users')
@Serialize(UserDto)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // Only admins can access all users
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.USER)
    // @Roles(UserRole.ADMIN)
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    @ApiResponse({ status: 201, description: 'User successfully created', type: UserDto })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email already in use' })
    @Serialize(UserDto)
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.create(createUserDto);
    }

    // Current user can access their own profile
    // @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiOkResponse({ description: 'Profile retrieved successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    async getProfile(@CurrentUser() user: User) {
        return user;
    }

    // Only admins can access all users
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    @ApiOkResponse({ description: 'Users retrieved successfully', type: [UserDto] })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    @ApiForbiddenResponse({ description: 'Admin access required' })
    findAll() {
        return this.usersService.findAll();
    }

    // Current user or admin can access specific user
    @UseGuards(JwtAuthGuard)
    @Get('/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiOkResponse({ description: 'User found successfully', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    @ApiForbiddenResponse({ description: 'You can only access your own profile' })
    findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: User) {
        // Allow if user is admin or accessing their own profile
        if (user.role !== UserRole.ADMIN && user.id !== id) {
            throw new ForbiddenException('You can only access your own profile');
        }
        return this.usersService.findById(id);
    }

    // Current user or admin can update
    @UseGuards(JwtAuthGuard)
    @Patch('/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user information' })
    @ApiOkResponse({ description: 'User successfully updated', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    @ApiForbiddenResponse({ description: 'You can only update your own profile' })
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() user: User
    ) {
        // Allow if user is admin or updating their own profile
        if (user.role !== UserRole.ADMIN && user.id !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }
        return this.usersService.update(id, updateUserDto);
    }


    // Only admins can delete users
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete('/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user (Admin only)' })
    @ApiOkResponse({ description: 'User successfully deleted' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    @ApiForbiddenResponse({ description: 'Admin access required' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        console.log('controller : Deleting user with ID : ', id);
        return await this.usersService.remove(id);
    }

}

