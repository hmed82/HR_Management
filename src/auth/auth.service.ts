import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { HashUtil } from '../common/utils/hash.util';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@/users/entities/user.entity';
import { AuthResponse } from '@/auth/interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private hashUtil: HashUtil,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.usersService.create(createUserDto);
    return this.generateToken(user);
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

    return this.generateToken(user);
  }

  private generateToken(user: User): AuthResponse {
    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
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
