import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from '@/auth/auth.service';
import { LoginDto } from '@/auth/dto/login.dto';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { AuthResponseDto } from '@/auth/dto/auth-response.dto';
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
  @ApiCreatedResponse({
    description:
      'User successfully registered. Returns access token, refresh token and user info.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Email already in use' })
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiOkResponse({
    description:
      'User successfully logged in. Returns access token, refresh token and user info.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Exchange a valid refresh token for a new access token (and a new refresh token).',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'New tokens generated',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    return this.authService.refresh(refreshTokenDto.refresh_token);
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
  async getMe(@CurrentUser() user: JwtUser): Promise<User> {
    return this.usersService.findById(user.id);
  }
}
