import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiQuery,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Paginate, Paginated } from 'nestjs-paginate';
import type { PaginateQuery } from 'nestjs-paginate';
import { TimeEntriesService } from '@/time-entries/services/time-entries.service';
import { ExcelParserService } from '@/time-entries/services/excel-parser.service';
import { CreateTimeEntryDto } from '@/time-entries/dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from '@/time-entries/dto/update-time-entry.dto';
import { TimeEntryDto } from '@/time-entries/dto/time-entry.dto';
import { TimeEntry } from '@/time-entries/entities/time-entry.entity';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/enums/user-role.enum';
import { Serialize } from '@/common/interceptors/serialize.interceptor';
import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

@ApiTags('Time Entries')
@ApiBearerAuth()
@Controller('time-entries')
export class TimeEntriesController {
  constructor(
    private readonly timeEntriesService: TimeEntriesService,
    private readonly excelParserService: ExcelParserService,
  ) {}

  @ApiOperation({ summary: 'Create a time entry (Admin only)' })
  @ApiCreatedResponse({
    description: 'Time entry created successfully',
    type: TimeEntryDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'Time entry already exists for this date',
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Serialize(TimeEntryDto)
  @Post()
  create(@Body() createDto: CreateTimeEntryDto): Promise<TimeEntry> {
    return this.timeEntriesService.create(createDto);
  }
  // TODO:
  // make the return into an interface to use here and in the service
  @ApiOperation({ summary: 'Get time entry statistics (Admin only)' })
  @ApiOkResponse({
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        byStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: Object.values(TimeEntryStatus) },
              count: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Get('stats/overview')
  getStatistics() {
    return this.timeEntriesService.getStatistics();
  }

  @ApiOperation({
    summary: 'Download Excel template for time entries',
    description:
      'HR can download this empty template, fill it or get it from the pointeuse, and upload it back',
  })
  @ApiOkResponse({
    description: 'Excel template file',
    content: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Get('export/template')
  downloadTemplate(@Res() res: Response) {
    const buffer = this.excelParserService.generateTemplate();

    const filename = `time-entries-template-${new Date().toISOString().split('T')[0]}.xlsx`;
    // YYYY-MM-DD split because ':' is not allowed in filenames on Windows the original name was gonna be like this:
    // time-entries-template-2025-10-15T12:34:56.789Z.xlsx
    // but now it's
    // time-entries-template-2025-10-15.xlsx

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.send(buffer);
  }

  @ApiOperation({
    summary: 'Get time entries for a specific date range',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date (YYYY-MM-DD)',
    example: '2025-10-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date (YYYY-MM-DD)',
    example: '2025-10-31',
  })
  @ApiOkResponse({
    description:
      'Time entries retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<TimeEntryDto>,
  })
  @ApiBadRequestResponse({ description: 'Invalid date format' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(TimeEntryDto)
  @Get('date-range')
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<TimeEntry>> {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new BadRequestException('Invalid date format. Expected YYYY-MM-DD');
    }

    return this.timeEntriesService.findByDateRange(startDate, endDate, query);
  }

  @ApiOperation({ summary: 'Get time entries for a specific employee' })
  @ApiOkResponse({
    description:
      'Time entries retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<TimeEntryDto>,
  })
  @ApiNotFoundResponse({ description: 'Employee not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(TimeEntryDto)
  @Get('employee/:employeeId')
  findByEmployee(
    @Param('employeeId', ParseIntPipe) employeeId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<TimeEntry>> {
    return this.timeEntriesService.findByEmployeeId(employeeId, query);
  }

  @ApiOperation({
    summary: 'Import time entries from Excel file (Admin only)',
    description:
      'Upload the Excel file from pointeuse to bulk import time entries. Uses transaction for data consistency.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file from pointeuse',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx or .xls) - Max 10MB',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Time entries imported successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        total: { type: 'number' },
        imported: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              employeeId: { type: 'number' },
              date: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid file or data' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Post('import/excel')
  //TODO:
  //Refactor this once i test it to make it follow proper structure and make it use .env variables for file size and types
  @UseInterceptors(FileInterceptor('file'))
  async importFromExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB max
          new FileTypeValidator({
            fileType:
              /(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel)/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Parse the Excel file
    const timeEntries = await this.excelParserService.parseExcelFile(
      file.buffer,
    );

    // Bulk import with transaction
    const result = await this.timeEntriesService.bulkImport(timeEntries);

    return {
      message: `Import completed: ${result.imported} succeeded, ${result.failed} failed`,
      ...result,
    };
  }

  @ApiOperation({ summary: 'Get all time entries (paginated)' })
  @ApiOkResponse({
    description:
      'Time entries retrieved successfully. Returns paginated result with data, meta (pagination info), and links.',
    type: Paginated<TimeEntryDto>,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'filter.employeeId',
    required: false,
    type: Number,
    description: 'Filter by employee ID',
  })
  @ApiQuery({
    name: 'filter.status',
    required: false,
    type: String,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'filter.date',
    required: false,
    type: String,
    description: 'Filter by date (YYYY-MM-DD)',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(TimeEntryDto)
  @Get()
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<TimeEntry>> {
    return this.timeEntriesService.findAll(query);
  }

  @ApiOperation({ summary: 'Get time entry by ID' })
  @ApiOkResponse({
    description: 'Time entry found successfully',
    type: TimeEntryDto,
  })
  @ApiNotFoundResponse({ description: 'Time entry not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @Serialize(TimeEntryDto)
  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number): Promise<TimeEntry> {
    return this.timeEntriesService.findById(id);
  }

  @ApiOperation({ summary: 'Update a time entry (Admin only)' })
  @ApiOkResponse({
    description: 'Time entry updated successfully',
    type: TimeEntryDto,
  })
  @ApiNotFoundResponse({ description: 'Time entry not found' })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({
    description: 'Time entry already exists for this date',
  })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Serialize(TimeEntryDto)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTimeEntryDto,
  ): Promise<TimeEntry> {
    return this.timeEntriesService.update(id, updateDto);
  }

  @ApiOperation({ summary: 'Delete a time entry (Admin only)' })
  @ApiNoContentResponse({ description: 'Time entry deleted successfully' })
  @ApiNotFoundResponse({ description: 'Time entry not found' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.timeEntriesService.delete(id);
  }

  @ApiOperation({
    summary: 'Bulk delete time entries (Admin only)',
    description: 'Delete multiple time entries by their IDs',
  })
  @ApiBody({
    description: 'Array of time entry IDs to delete',
    schema: {
      type: 'object',
      required: ['ids'],
      properties: {
        ids: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Time entries deleted successfully',
    schema: {
      type: 'object',
      properties: {
        deleted: { type: 'number' },
        failed: { type: 'number' },
        errors: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated' })
  @ApiForbiddenResponse({ description: 'Admin access required' })
  @Roles(UserRole.ADMIN)
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body('ids') ids: number[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids must be a non-empty array');
    }

    return await this.timeEntriesService.bulkDelete(ids);
  }
}
