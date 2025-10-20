import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeEntry } from '@/time-entries/entities/time-entry.entity';
import { CreateTimeEntryDto } from '@/time-entries/dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from '@/time-entries/dto/update-time-entry.dto';
import { determineStatusFromClocks } from '@/time-entries/utils/time-entry.utils';
import {
  PaginateQuery,
  paginate,
  Paginated,
  FilterOperator,
} from 'nestjs-paginate';
import { EmployeesService } from '@/employees/employees.service';

@Injectable()
export class TimeEntriesService {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepo: Repository<TimeEntry>,
    private readonly employeesService: EmployeesService,
  ) {}

  async create(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    const { employeeId, ...rest } = createTimeEntryDto;

    // i should create an other method in employees service that only checks existence by id and if error logges it it instead of throwing not found exception
    await this.employeesService.findById(employeeId);

    const status = determineStatusFromClocks(
      createTimeEntryDto.clockIn,
      createTimeEntryDto.clockOut,
    );

    const timeEntry = this.timeEntryRepo.create({
      employeeId,
      ...rest,
      status,
    });

    return this.timeEntryRepo.save(timeEntry);
  }

  async findAll(query: PaginateQuery): Promise<Paginated<TimeEntry>> {
    const queryBuilderRepo = this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.employee', 'employee');

    return paginate(query, queryBuilderRepo, {
      sortableColumns: [
        'id',
        'employeeId',
        'date',
        'clockIn',
        'clockOut',
        'createdAt',
      ],
      searchableColumns: ['employeeId'],
      filterableColumns: {
        employeeId: [FilterOperator.EQ],
        date: [FilterOperator.EQ, FilterOperator.GTE, FilterOperator.LTE],
        status: [FilterOperator.EQ],
      },
      defaultSortBy: [['date', 'DESC']],
      defaultLimit: 20,
      maxLimit: 200,
    } as any);
  }
  async findById(id: number): Promise<TimeEntry> {
    const timeEntry = await this.timeEntryRepo.findOne({ where: { id } });
    if (!timeEntry) {
      throw new NotFoundException(`TimeEntry with ID ${id} not found`);
    }

    return timeEntry;
  }

  async update(
    id: number,
    updateTimeEntryDto: UpdateTimeEntryDto,
  ): Promise<TimeEntry> {
    const existingTimeEntry = await this.findById(id);
    const mergedTimeEntry = this.timeEntryRepo.merge(
      existingTimeEntry,
      updateTimeEntryDto,
    );
    mergedTimeEntry.status = determineStatusFromClocks(
      mergedTimeEntry.clockIn,
      mergedTimeEntry.clockOut,
    );
    return this.timeEntryRepo.save(mergedTimeEntry);
  }

  async delete(id: number): Promise<void> {
    const existingTimeEntry = await this.findById(id);
    await this.timeEntryRepo.remove(existingTimeEntry);
  }

  async getStatistics() {
    const byStatus = await this.timeEntryRepo
      .createQueryBuilder('te')
      .select('te.status', 'status')
      .addSelect('COUNT(te.id)', 'count')
      .groupBy('te.status')
      .getRawMany();

    return byStatus.map((item) => ({
      status: item.status,
      count: parseInt(item.count, 10),
    }));
  }
}
