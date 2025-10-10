import { Module } from '@nestjs/common';
import { AuthService } from '@/user/services/auth.service';
import { UserController } from '@/user/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/user/entities/user.entity';
import { CryptoService } from '@/user/services/crypto.service';
import { UserService } from '@/user/services/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [AuthService, CryptoService, UserService],
  controllers: [UserController]
})
export class UserModule { }
