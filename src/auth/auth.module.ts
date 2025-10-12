import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from '@/auth/auth.service';
import { AuthController } from '@/auth/auth.controller';
import { UsersModule } from '@/users/users.module';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { HashUtil } from '@/common/utils/hash.util';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: 'configService.get<string>(JWT_SECRET) || your-secret-key',
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN', '1d') },
      }),
    }),

    // JwtModule.register({
    //   global: true,
    //   secret: 'jwtConstants.secret',
    //   signOptions: { expiresIn: '60s' },
    // }),

  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    HashUtil,
    // Make JwtAuthGuard global
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Make RolesGuard global
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule { }