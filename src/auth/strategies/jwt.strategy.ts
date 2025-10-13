import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }
    const loggedinUser = 'oggedinUser';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts token from Authorization: Bearer <token> header
      ignoreExpiration: false,
      secretOrKey: jwtSecret, // Verify signature using this secret
    }); // Passport decodes payload to get { sub: 1, role: 'user' }
  }

  // Validate: Called AFTER token is verified
  async validate(payload: any) {
    // payload's value is = { sub: 1, role: 'user' }
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive or does not exist');
    }

    // This return value becomes attached to request.user
    return {
      id: user.id,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
