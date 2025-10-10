import { Controller, Post, Get, Put, Body, HttpCode, HttpStatus, Param, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiNotFoundResponse, ApiConflictResponse, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { JwtAuthGuard } from './guards/jwt-auth.guard'; // I'll create this later
import { UserDto } from './dto/user.dto';
import { Serialize } from '@/common/interceptors/serialize.interceptor';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered', type: UserDto })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email already registered' })
    @Serialize(UserDto)
    async register(@Body() createUserDto: CreateUserDto) {
        return await this.authService.register(createUserDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiOkResponse({ description: 'User successfully logged in' })
    @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

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
    @Get('users/:id')
    // @ApiBearerAuth() // Uncomment when JWT guard is implemented
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiOkResponse({ description: 'User found successfully', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Serialize(UserDto)
    async findById(@Param('id', ParseIntPipe) id: number) {
        return this.authService.findById(id);
    }

    // (protected) Update user by ID
    // @UseGuards(JwtAuthGuard)
    @Put('users/:id')
    // @ApiBearerAuth() // Uncomment when JWT guard is implemented
    @ApiOperation({ summary: 'Update user information' })
    @ApiOkResponse({ description: 'User successfully updated', type: UserDto })
    @ApiNotFoundResponse({ description: 'User not found' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Unauthorized' })
    @Serialize(UserDto)
    async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
        console.log('Controller: Updating user with ID:', id, 'and data:', updateUserDto);
        return await this.authService.updateUser(id, updateUserDto);
    }
}
