import { Module } from '@nestjs/common';
import { TimeEntriesService } from '@/time-entries/services/time-entries.service';
import { ExcelParserService } from '@/time-entries/services/excel-parser.service';
import { TimeEntriesController } from '@/time-entries/time-entries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimeEntry } from '@/time-entries/entities/time-entry.entity';
import { EmployeesModule } from '@/employees/employees.module';

@Module({
  imports: [TypeOrmModule.forFeature([TimeEntry]), EmployeesModule],
  providers: [TimeEntriesService, ExcelParserService],
  controllers: [TimeEntriesController],
})
export class TimeEntriesModule {}
