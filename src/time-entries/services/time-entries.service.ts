import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
import { BulkImportResult } from '@/time-entries/interfaces/bulk-import-result.interface';
import { TimeEntryStatistics } from '@/time-entries/interfaces/time-entery-statistics.interface';

@Injectable()
export class TimeEntriesService {
  private readonly logger = new Logger(TimeEntriesService.name);

  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepo: Repository<TimeEntry>,
    private readonly employeesService: EmployeesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createTimeEntryDto: CreateTimeEntryDto): Promise<TimeEntry> {
    const { employeeId, date, clockIn, clockOut } = createTimeEntryDto;

    // Verify employee exists
    await this.employeesService.findById(employeeId);

    // Check for duplicate entry on same date
    const existingEntry = await this.timeEntryRepo.findOne({
      where: { employeeId, date: new Date(date) },
    });

    if (existingEntry) {
      throw new ConflictException(
        `Time entry already exists for employee ${employeeId} on ${date}`,
      );
    }

    // Determine status based on clock times
    const status = determineStatusFromClocks(clockIn, clockOut);

    const timeEntry = this.timeEntryRepo.create({
      employeeId,
      date: new Date(date),
      clockIn,
      clockOut,
      status,
    });

    return await this.timeEntryRepo.save(timeEntry);
  }

  async bulkImport(
    timeEntries: CreateTimeEntryDto[],
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      total: timeEntries.length,
      imported: 0,
      failed: 0,
      errors: [],
    };

    // Use transaction for better performance and data consistency
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const dto of timeEntries) {
        try {
          // Check if employee exists
          await this.employeesService.findById(dto.employeeId);

          // Check for duplicate
          const existing = await queryRunner.manager.findOne(TimeEntry, {
            where: {
              employeeId: dto.employeeId,
              date: new Date(dto.date),
            },
          });

          if (existing) {
            result.failed++;
            result.errors.push({
              employeeId: dto.employeeId,
              date: dto.date,
              error: 'Duplicate entry for this date',
            });
            continue;
          }

          // Create entry
          const status = determineStatusFromClocks(dto.clockIn, dto.clockOut);
          const timeEntry = queryRunner.manager.create(TimeEntry, {
            employeeId: dto.employeeId,
            date: new Date(dto.date),
            clockIn: dto.clockIn,
            clockOut: dto.clockOut,
            status,
          });

          await queryRunner.manager.save(timeEntry);
          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            employeeId: dto.employeeId,
            date: dto.date,
            error: error.message,
          });
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `Bulk import completed: ${result.imported} imported, ${result.failed} failed`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Bulk import transaction failed', error.stack);
      throw new BadRequestException('Bulk import failed: ' + error.message);
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  async findAll(query: PaginateQuery): Promise<Paginated<TimeEntry>> {
    const queryBuilder = this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.employee', 'employee');

    return paginate(query, queryBuilder, {
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
    const timeEntry = await this.timeEntryRepo.findOne({
      where: { id },
      relations: ['employee'],
    });

    if (!timeEntry) {
      throw new NotFoundException(`TimeEntry with ID ${id} not found`);
    }

    return timeEntry;
  }

  async findByEmployeeId(
    employeeId: number,
    query: PaginateQuery,
  ): Promise<Paginated<TimeEntry>> {
    // Verify employee exists
    await this.employeesService.findById(employeeId);

    const queryBuilder = this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .where('timeEntry.employeeId = :employeeId', { employeeId });

    return paginate(query, queryBuilder, {
      sortableColumns: ['id', 'date', 'clockIn', 'clockOut', 'createdAt'],
      filterableColumns: {
        date: [FilterOperator.EQ, FilterOperator.GTE, FilterOperator.LTE],
        status: [FilterOperator.EQ],
      },
      defaultSortBy: [['date', 'DESC']],
      defaultLimit: 20,
      maxLimit: 200,
    } as any);
  }

  async update(
    id: number,
    updateTimeEntryDto: UpdateTimeEntryDto,
  ): Promise<TimeEntry> {
    const existingTimeEntry = await this.findById(id);

    // If employee is being changed, verify new employee exists
    if (
      updateTimeEntryDto.employeeId &&
      updateTimeEntryDto.employeeId !== existingTimeEntry.employeeId
    ) {
      await this.employeesService.findById(updateTimeEntryDto.employeeId);

      // Check for duplicate with new employee
      if (updateTimeEntryDto.date) {
        const duplicate = await this.timeEntryRepo.findOne({
          where: {
            employeeId: updateTimeEntryDto.employeeId,
            date: new Date(updateTimeEntryDto.date),
          },
        });

        if (duplicate && duplicate.id !== id) {
          throw new ConflictException(
            'Time entry already exists for this employee on this date',
          );
        }
      }
    }

    // Merge updates
    const mergedTimeEntry = this.timeEntryRepo.merge(
      existingTimeEntry,
      updateTimeEntryDto,
    );

    // Recalculate status
    mergedTimeEntry.status = determineStatusFromClocks(
      mergedTimeEntry.clockIn,
      mergedTimeEntry.clockOut,
    );

    return await this.timeEntryRepo.save(mergedTimeEntry);
  }

  async delete(id: number): Promise<void> {
    const existingTimeEntry = await this.findById(id);
    await this.timeEntryRepo.remove(existingTimeEntry);
    this.logger.log(`Time entry ${id} deleted successfully`);
  }

  async bulkDelete(ids: number[]): Promise<{
    deleted: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      deleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of ids) {
      try {
        await this.delete(id);
        result.deleted++;
      } catch (error) {
        result.failed++;
        result.errors.push(`ID ${id}: ${error.message}`);
      }
    }

    this.logger.log(
      `Bulk delete completed: ${result.deleted} deleted, ${result.failed} failed`,
    );
    return result;
  }

  async getStatistics(): Promise<TimeEntryStatistics> {
    // Get total count
    const total = await this.timeEntryRepo.count();

    // Get count by status
    const byStatus = await this.timeEntryRepo
      .createQueryBuilder('te')
      .select('te.status', 'status')
      .addSelect('COUNT(te.id)', 'count')
      .groupBy('te.status')
      .getRawMany();

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: parseInt(item.count, 10),
      })),
    };
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
    query: PaginateQuery,
  ): Promise<Paginated<TimeEntry>> {
    const queryBuilder = this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.employee', 'employee')
      .where('timeEntry.date >= :startDate', { startDate })
      .andWhere('timeEntry.date <= :endDate', { endDate });

    return paginate(query, queryBuilder, {
      sortableColumns: ['id', 'date', 'employeeId', 'clockIn', 'clockOut'],
      filterableColumns: {
        employeeId: [FilterOperator.EQ],
        status: [FilterOperator.EQ],
      },
      defaultSortBy: [['date', 'DESC']],
      defaultLimit: 20,
      maxLimit: 200,
    } as any);
  }
}
