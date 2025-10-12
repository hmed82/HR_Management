import { Module } from '@nestjs/common';
import { UsersController } from '@/users/users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { UsersService } from '@/users/users.service';
import { ConfigModule } from '@nestjs/config';
import { HashUtil } from '@/common/utils/hash.util';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, HashUtil],
  exports: [UsersService],
})
export class UsersModule { }
