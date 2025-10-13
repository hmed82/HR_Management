import { Controller, Get, Post, Body, Patch, Param, Delete, ForbiddenException, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBearerAuth, ApiResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UsersService } from '@/users/users.service';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { UserDto } from '@/users/dto/user.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { UserRole } from '@/users/enums/user-role.enum';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/users/decorators/current-user.decorator';
import type { JwtUser } from '@/users/decorators/current-user.decorator';


@ApiTags('Users')
@Controller('users')
@Serialize(UserDto)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    // Only admins can create users
    @Roles(UserRole.ADMIN) // Global guards already applied
    @Post()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new user (Admin only)' })
    @ApiResponse({ status: 201, description: 'User successfully created', type: UserDto })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email already in use' })
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.usersService.create(createUserDto);
    }

    // Current user's profile
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiOkResponse({ description: 'Profile retrieved successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    async getProfile(@CurrentUser() user: JwtUser) {
        console.log('')
        console.log('')
        console.log(user)
        console.log('')
        console.log('')
        return this.usersService.findById(user.id);
    }

    // User or admin can access specific user
    @Get('/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiOkResponse({ description: 'User found successfully', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    @ApiForbiddenResponse({ description: 'You can only access your own profile' })
    findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
        console.log('')
        console.log('')
        console.log('user is : ', user)
        console.log('')
        console.log('')
        if (user.role !== UserRole.ADMIN && user.id !== id) {
            throw new ForbiddenException('You can only access your own profile');
        }
        return this.usersService.findById(id);
    }

    // Only admins can get all users
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

    // User or admin can update
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
        @CurrentUser() user: JwtUser
    ) {
        if (user.role !== UserRole.ADMIN && user.id !== id) {
            throw new ForbiddenException('You can only update your own profile');
        }
        return this.usersService.update(id, updateUserDto);
    }

    // Only admins can delete
    @Roles(UserRole.ADMIN)
    @Delete('/:id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user (Admin only)' })
    @ApiOkResponse({ description: 'User successfully deleted' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    @ApiForbiddenResponse({ description: 'Admin access required' })
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.usersService.remove(id);
    }
}