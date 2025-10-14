import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsController } from './departments.controller';
import { Department } from '@/departments/entities/department.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Department]), ConfigModule],

  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule { }
