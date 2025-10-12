import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiResponse, ApiBadRequestResponse, ApiUnauthorizedResponse, ApiConflictResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UserDto } from '@/users/dto/user.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    // Public routes - no authentication required
    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered', type: UserDto })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiConflictResponse({ description: 'Email already in use' })
    register(@Body() createUserDto: CreateUserDto) {
        return this.authService.register(createUserDto);
    }

    @Public()
    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiOkResponse({ description: 'User successfully logged in' })
    @ApiBadRequestResponse({ description: 'Invalid input data' })
    @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    // Current user can access their own info
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user information' })
    @ApiOkResponse({ description: 'User information retrieved successfully', type: UserDto })
    @ApiUnauthorizedResponse({ description: 'Not authenticated' })
    async getMe(@CurrentUser() user: User) {
        return { user };
    }
}