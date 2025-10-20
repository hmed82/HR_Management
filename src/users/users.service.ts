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
import {
  PaginateQuery,
  paginate,
  Paginated,
  FilterOperator,
} from 'nestjs-paginate';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private hashUtil: HashUtil,
  ) {}

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

  async findAll(query: PaginateQuery): Promise<Paginated<User>> {
    return paginate(query, this.usersRepo, {
      sortableColumns: ['id', 'email', 'name', 'createdAt', 'updatedAt'],
      searchableColumns: ['email', 'name'],
      filterableColumns: {
        role: [FilterOperator.EQ],
        email: [FilterOperator.EQ, FilterOperator.ILIKE],
      },
      defaultSortBy: [['id', 'ASC']],
      defaultLimit: 10,
      maxLimit: 100,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepo.findOne({ where: { email } });
    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashUtil.hashPassword(
        updateUserDto.password,
      );
    }

    Object.assign(user, updateUserDto);
    return this.usersRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepo.remove(user);
  }
}
