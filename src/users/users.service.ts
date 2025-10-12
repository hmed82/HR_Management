import { ConflictException, NotFoundException, Injectable } from '@nestjs/common';
import { User } from '@/users/entities/user.entity';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashUtil } from '@/common/utils/hash.util'

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepo: Repository<User>,
        private hashUtil: HashUtil,
    ) { }


    async create(createUserDto: CreateUserDto): Promise<User> {
        const { email, password, ...rest } = createUserDto;

        const existingUser = await this.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already in use')
        }

        const hashedPassword = await this.hashUtil.hashPassword(password);
        const user = this.usersRepo.create({
            email,
            password: hashedPassword,
            ...rest,
        });
        return await this.usersRepo.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepo.find();
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.usersRepo.findOne({ where: { email } });
        console.log(user)
        return user;
    }

    async findById(id: number): Promise<User | null> {
        const user = await this.usersRepo.findOne({ where: { id } });
        return user;
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (updateUserDto.password) {
            updateUserDto.password = await this.hashUtil.hashPassword(updateUserDto.password);
        }
        Object.assign(user, updateUserDto);
        return this.usersRepo.save(user);
    }

    async remove(id: number): Promise<void> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }
        await this.usersRepo.remove(user);
    }
}

