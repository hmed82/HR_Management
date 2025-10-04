import { Controller, Post, Get, Put, Body, HttpCode, HttpStatus, Param, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { JwtAuthGuard } from './guards/jwt-auth.guard'; // I’ll create this later


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(@Body() createUserDto: CreateUserDto) {
        return await this.authService.register(createUserDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'User successfully logged in' })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.login(loginDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'User successfully logged out' })
    async logout(@Req() req: any) {
        // req.user will come from JWT guard later
        console.log('Logging out user:', req.user);
        return await this.authService.logout();
    }

    // (protected) Get user by ID
    // @UseGuards(JwtAuthGuard)
    @Get('users/:id')
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'User found successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findById(@Param('id', ParseIntPipe) id: number) {
        return this.authService.findById(id);
    }

    @Put('users/:id')
    @ApiOperation({ summary: 'Update user information' })
    @ApiResponse({ status: 200, description: 'User successfully updated' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async updateUser(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
        return await this.authService.updateUser(id, updateUserDto);
    }

}
