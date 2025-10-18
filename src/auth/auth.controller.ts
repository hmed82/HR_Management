import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UserDto } from '@/users/dto/user.dto';
import { Public } from '@/auth/decorators/public.decorator';
import { CurrentUser } from '@/users/decorators/current-user.decorator';
import type { JwtUser } from '@/users/decorators/current-user.decorator';
import { UsersService } from '@/users/users.service';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { User } from '@/users/entities/user.entity';
import { AuthResponse } from '@/auth/interfaces/auth-response.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // Public routes - no authentication required
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already in use' })
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({ description: 'User successfully logged in' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  // Current user can access their own info
  @Serialize(UserDto)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiOkResponse({
    description: 'User information retrieved successfully',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  async getMe(@CurrentUser() user: JwtUser): Promise<User | null> {
    return this.usersService.findById(user.id);
  }
}
