import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { HashUtil } from '../common/utils/hash.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@/users/entities/user.entity';
import { AuthResponse } from '@/auth/interfaces/auth-response.interface';
import { UserRole } from '@/users/enums/user-role.enum';
import type { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private hashUtil: HashUtil,
    private configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    // Security: self-registration always creates a regular user.
    // Admin accounts are provisioned by an admin (or the seed script).
    const user = await this.usersService.create({
      ...createUserDto,
      role: UserRole.USER,
    });
    return this.generateTokens(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.hashUtil.comparePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  /**
   * Exchange a valid refresh token for a new pair of tokens.
   * The refresh token uses its own secret + expiry (JWT_REFRESH_*).
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_REFRESH_SECRET must be defined in environment variables',
      );
    }

    let payload: { sub: number; role: UserRole };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or does not exist');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User): AuthResponse {
    const payload = { sub: user.id, role: user.role };

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET must be defined in environment variables',
      );
    }

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '604800s',
        ) as JwtSignOptions['expiresIn'],
      }),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // async logout(): Promise<{ message: string }> {
  //   // With stateless JWT, logout is handled client-side
  //   // (you can implement token blacklist if needed)
  //   // what i will probably do is to have a refresh token and store it in the user table
  //   // and delete it on logout and blacklist the access token for its remaining time to live
  //   return { message: 'Logged out successfully' };
  // }
}
