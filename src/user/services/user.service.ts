import { ConflictException, NotFoundException, Injectable } from '@nestjs/common';
import { User } from '@/user/entities/user.entity';
import { CreateUserDto } from '@/user/dto/create-user.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from "@/user/services/crypto.service"


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly cryptoService: CryptoService,
    ) { }

    async createUser(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, ...rest } = createUserDto;

        const existingUser = await this.userRepo.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const hashedPassword = await this.cryptoService.hashPassword(password);
        const user = this.userRepo.create({
            email,
            password: hashedPassword,
            ...rest,
        });
        return await this.userRepo.save(user);
    }

    async findByEmail(email: string): Promise<User> {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findById(id: number): Promise<User> {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateUser(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (updateUserDto.password) {
            updateUserDto.password = await this.cryptoService.hashPassword(updateUserDto.password);
        }
        Object.assign(user, updateUserDto);
        return this.userRepo.save(user);
    }

    async deleteUser(id: number): Promise<void> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.userRepo.remove(user);
    }
}

