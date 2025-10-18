import { Module } from '@nestjs/common';
import { TimeEntriesService } from '@/time-entries/services/time-entries.service';
import { ExcelParserService } from '@/time-entries/services/excel-parser.service';
import { TimeEntriesController } from '@/time-entries/time-entries.controller';

@Module({
  providers: [TimeEntriesService, ExcelParserService],
  controllers: [TimeEntriesController]
})
export class TimeEntriesModule { }
