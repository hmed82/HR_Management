import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { HashUtil } from '@/common/utils/hash.util';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { AuthResponse } from './interfaces/auth-response.interface';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let hashUtil: jest.Mocked<HashUtil>;

  const makeUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 1,
      email: 'admin@example.com',
      password: 'hashed',
      name: 'Admin',
      isActive: true,
      role: UserRole.ADMIN,
      ...overrides,
    }) as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, def?: any) => {
              const values: Record<string, any> = {
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_REFRESH_EXPIRES_IN: '604800s',
              };
              return values[key] ?? def;
            },
          },
        },
        {
          provide: HashUtil,
          useValue: { hashPassword: jest.fn(), comparePassword: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    hashUtil = module.get(HashUtil);

    // tokens
    jwtService.sign.mockImplementation((payload: any, options?: any) => {
      return options ? `refresh.${payload.sub}` : `access.${payload.sub}`;
    });
  });

  describe('register', () => {
    it('creates the user and returns both tokens', async () => {
      usersService.create.mockResolvedValue(makeUser());

      const result = await service.register({
        email: 'admin@example.com',
        password: 'Secret123',
      });

      // register must force the plain "user" role (no self-promotion to admin)
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'Secret123',
        role: UserRole.USER,
      });
      expect(result.access_token).toBe('access.1');
      expect(result.refresh_token).toBe('refresh.1');
      expect(result.user.email).toBe('admin@example.com');
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const user = makeUser();
      usersService.findByEmail.mockResolvedValue(user);
      hashUtil.comparePassword.mockResolvedValue(true);

      const result: AuthResponse = await service.login({
        email: 'admin@example.com',
        password: 'Secret123',
      });

      expect(result.access_token).toBe('access.1');
      expect(result.refresh_token).toBe('refresh.1');
      expect(result.user).toEqual({
        id: 1,
        email: 'admin@example.com',
        role: UserRole.ADMIN,
      });
    });

    it('rejects an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'Secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());
      hashUtil.comparePassword.mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@example.com', password: 'Wrong123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('returns new tokens for a valid refresh token', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        role: UserRole.ADMIN,
      });
      usersService.findById.mockResolvedValue(makeUser());

      const result = await service.refresh('valid-refresh-token');

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        {
          secret: 'refresh-secret',
        },
      );
      expect(result.access_token).toBe('access.1');
      expect(result.refresh_token).toBe('refresh.1');
    });

    it('rejects an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects when the user no longer exists or is inactive', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 99,
        role: UserRole.USER,
      });
      usersService.findById.mockResolvedValue(
        makeUser({ id: 99, isActive: false }),
      );

      await expect(service.refresh('token-inactive-user')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
