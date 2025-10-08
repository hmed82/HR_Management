import { ConflictException, NotFoundException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { User } from '@/auth/entities/user.entity';
import { CreateUserDto } from '@/auth/dto/create-user.dto';
import { UpdateUserDto } from '@/auth/dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';



@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        private configService: ConfigService,
        // private readonly jwtService: JwtService,
    ) { }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10);
        if (isNaN(saltRounds) || saltRounds < 4 || saltRounds > 31) {
            throw new Error('BCRYPT_SALT_ROUNDS must be between 4 and 31');
        }
        try {
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            throw new Error('Hashing failed, error details: ' + error.message);
        }
    }

    async register(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, ...rest } = createUserDto;

        const existingUser = await this.usersRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await this.hashPassword(password);
        const user = this.usersRepo.create({
            email,
            password: hashedPassword,
            ...rest,
        });
        return await this.usersRepo.save(user);
    }

    async login(loginDto: LoginDto): Promise<{ accessToken: string } | string> {
        const user = await this.usersRepo.findOne({ where: { email: loginDto.email } });
        if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');

        }
        // const accessToken = this.generateAccessToken(user);
        // return { accessToken };
        return "token";
    }

    async logout() {
        // With stateless JWT, logout is handled client-side
        // (you can implement token blacklist if needed)
        // what i will probably do is to have a refresh token and store it in the user table and delete it on logout and blacklist the access token for its remaining time to live
        return { message: 'Logged out successfully' };
    }

    async findByEmail(email: string): Promise<User> {
        const user = await this.usersRepo.findOne({ where: { email } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findById(id: number): Promise<User> {
        const user = await this.usersRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        Object.assign(user, updateUserDto);
        return this.usersRepo.save(user);
    }
}

