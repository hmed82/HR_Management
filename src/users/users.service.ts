import {
  ConflictException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { User } from '@/users/entities/user.entity';
import { CreateUserDto } from '@/users/dto/create-user.dto';
import { UpdateUserDto } from '@/users/dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HashUtil } from '@/common/utils/hash.util';
import { PaginatedResult } from '@/common/interfaces/paginated-result.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private hashUtil: HashUtil,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, ...rest } = createUserDto;

    const existingUser = await this.usersRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await this.hashUtil.hashPassword(password);
    const user = this.usersRepo.create({
      email,
      password: hashedPassword,
      ...rest,
    });
    return await this.usersRepo.save(user);
  }

  async findAll(page: number, limit: number): Promise<PaginatedResult<User>> {
    // findAndCount() returns array: [items, total count]
    const [items, total] = await this.usersRepo.findAndCount({
      skip: (page - 1) * limit, // OFFSET: how many records to skip
      take: limit,
    });

    // Return paginated response with metadata
    return {
      data: items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({ where: { email } });
    return user;
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.usersRepo.findOne({ where: { id } });
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashUtil.hashPassword(
        updateUserDto.password,
      );
    }

    Object.assign(user, updateUserDto);
    return this.usersRepo.save(user);
  }

  async remove(id: number): Promise<string> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepo.remove(user);
    return 'User successfully deleted';
  }
}