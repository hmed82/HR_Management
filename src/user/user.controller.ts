import { Controller, Post, Get, Put, Delete, Body, HttpCode, HttpStatus, Param, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '@/user/services/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from '@/user/services/user.service';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
// import { JwtAuthGuard } from './guards/jwt-auth.guard'; // I'll create this later

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiOkResponse({ description: 'User successfully logged in' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

    // (protected) Get user by ID
    // @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    // @ApiBearerAuth() // Uncomment when JWT guard is implemented
    @ApiOperation({ summary: 'Logout user' })
    @ApiOkResponse({ description: 'User successfully logged out' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async logout(@Req() req: any) {
        // req.user will come from JWT guard later
        return await this.authService.logout();
    }

    // (protected) Get user by ID
    // @UseGuards(JwtAuthGuard)
    @Post('create')
    @ApiOperation({ summary: 'Create a new user' })
    @ApiResponse({ status: 201, description: 'User successfully created', type: UserDto })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email already in use' })
    @Serialize(UserDto)
    async create(@Body() createUserDto: CreateUserDto) {
        return await this.userService.createUser(createUserDto);
    }

    // (protected) Get user by ID
    // @UseGuards(JwtAuthGuard)
    @Get('/:id')
    // @ApiBearerAuth() // Uncomment when JWT guard is implemented
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiOkResponse({ description: 'User found successfully', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Serialize(UserDto)
    async findById(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findById(id);
    }

    // (protected) Update user by ID
    // @UseGuards(JwtAuthGuard)
    @Put('/:id')
    // @ApiBearerAuth() // Uncomment when JWT guard is implemented
    @ApiOperation({ summary: 'Update user information' })
    @ApiOkResponse({ description: 'User successfully updated', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Serialize(UserDto)
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        console.log('Controller: Updating user with ID:', id, 'and data:', updateUserDto);
        return await this.userService.updateUser(id, updateUserDto);
    }

    //(protected) Delete user by ID
    // @UserGuards(JwtAuthGuard)
    @Delete('/:id')
    // @ApiBearerAuth() // Uncomment when JWT guard is implemented
    @ApiOperation({ summary: 'Delete user' })
    @ApiOkResponse({ description: 'User successfully Deleted' })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    async delete(@Param('id', ParseIntPipe) id: number) {
        console.log('controller : Deleting user with ID : ', id)
        return await this.userService.deleteUser(id)
    }

}

