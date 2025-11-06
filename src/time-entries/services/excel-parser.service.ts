import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { CreateTimeEntryDto } from '@/time-entries/dto/create-time-entry.dto';
import { ParsedTimeEntry } from '@/time-entries/interfaces/parsed-time-entry.interface';

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  /**
   * Parse Excel file from pointeuse and extract time entries
   * Expected format:
   * | Employee ID | Date       | Clock In | Clock Out |
   * | 1           | 2025-10-22 | 08:30:00 | 17:30:00  |
   */
  async parseExcelFile(buffer: Buffer): Promise<CreateTimeEntryDto[]> {
    try {
      // Read the workbook from buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new BadRequestException('Excel file is empty or has no sheets');
      }

      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false, // Keep values as strings for better control
        defval: null, // Default value for empty cells
      });

      if (!rawData || rawData.length === 0) {
        throw new BadRequestException('Excel file contains no data rows');
      }

      this.logger.log(`Parsing ${rawData.length} rows from Excel file`);

      // Parse and validate each row
      const timeEntries: CreateTimeEntryDto[] = [];
      const errors: string[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header

        try {
          const entry = this.parseRow(row, rowNumber);
          timeEntries.push(entry);
        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error.message}`);
        }
      }

      // If there are any errors, throw them all at once
      if (errors.length > 0) {
        throw new BadRequestException({
          message: 'Excel file contains invalid data',
          errors,
        });
      }

      this.logger.log(`Successfully parsed ${timeEntries.length} time entries`);
      return timeEntries;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to parse Excel file', error.stack);
      throw new BadRequestException(
        `Failed to parse Excel file: ${error.message}`,
      );
    }
  }

  /**
   * Parse a single row from the Excel file
   */
  private parseRow(row: any, rowNumber: number): CreateTimeEntryDto {
    // Support multiple column name variations (case-insensitive)
    const employeeId = this.extractValue(row, [
      'Employee ID',
      'EmployeeID',
      'employee_id',
      'ID',
    ]);
    const date = this.extractValue(row, ['Date', 'date', 'DATE']);
    const clockIn = this.extractValue(row, [
      'Clock In',
      'ClockIn',
      'clock_in',
      'Check In',
    ]);
    const clockOut = this.extractValue(row, [
      'Clock Out',
      'ClockOut',
      'clock_out',
      'Check Out',
    ]);

    // Validate required fields
    if (!employeeId) {
      throw new Error('Employee ID is required');
    }
    if (!date) {
      throw new Error('Date is required');
    }
    if (!clockIn) {
      throw new Error('Clock In time is required');
    }

    // Parse and validate employee ID
    const parsedEmployeeId = parseInt(employeeId, 10);
    if (isNaN(parsedEmployeeId) || parsedEmployeeId <= 0) {
      throw new Error(`Invalid Employee ID: ${employeeId}`);
    }

    // Validate and format date
    const formattedDate = this.parseAndValidateDate(date);

    // Validate and format times
    const formattedClockIn = this.parseAndValidateTime(clockIn, 'Clock In');
    const formattedClockOut = clockOut
      ? this.parseAndValidateTime(clockOut, 'Clock Out')
      : undefined;

    // Validate that clock out is after clock in
    if (formattedClockOut) {
      this.validateTimeOrder(formattedClockIn, formattedClockOut);
    }

    return {
      employeeId: parsedEmployeeId,
      date: formattedDate,
      clockIn: formattedClockIn,
      clockOut: formattedClockOut,
    };
  }

  /**
   * Extract value from row using multiple possible column names
   */
  private extractValue(row: any, possibleNames: string[]): string | null {
    for (const name of possibleNames) {
      // Try exact match
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }

      // Try case-insensitive match
      const keys = Object.keys(row);
      const matchingKey = keys.find(
        (key) => key.toLowerCase() === name.toLowerCase(),
      );
      if (
        matchingKey &&
        row[matchingKey] !== undefined &&
        row[matchingKey] !== null &&
        row[matchingKey] !== ''
      ) {
        return String(row[matchingKey]).trim();
      }
    }
    return null;
  }

  /**
   * Parse and validate date in various formats
   */
  private parseAndValidateDate(dateStr: string): string {
    // Remove any extra whitespace
    dateStr = dateStr.trim();

    // Try to parse common date formats
    let parsedDate: Date | null = null;

    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      parsedDate = new Date(dateStr);
    }
    // DD/MM/YYYY
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      parsedDate = new Date(`${year}-${month}-${day}`);
    }
    // MM/DD/YYYY
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
      parsedDate = new Date(dateStr);
    }
    // DD-MM-YYYY
    else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('-');
      parsedDate = new Date(`${year}-${month}-${day}`);
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      throw new Error(
        `Invalid date format: ${dateStr}. Expected YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY`,
      );
    }

    // Return in ISO format (YYYY-MM-DD)
    return parsedDate.toISOString().split('T')[0];
  }

  /**
   * Parse and validate time in HH:mm:ss format
   */
  private parseAndValidateTime(timeStr: string, fieldName: string): string {
    timeStr = timeStr.trim();

    // Support HH:mm:ss or HH:mm formats
    let formattedTime: string;

    if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeStr)) {
      // Already in HH:mm:ss format
      formattedTime = timeStr;
    } else if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
      // HH:mm format, add :00 for seconds
      formattedTime = `${timeStr}:00`;
    } else {
      throw new Error(
        `Invalid ${fieldName} format: ${timeStr}. Expected HH:mm:ss or HH:mm`,
      );
    }

    // Pad hours with leading zero if needed
    const [hours, minutes, seconds] = formattedTime.split(':');
    const paddedHours = hours.padStart(2, '0');

    // Validate ranges
    const h = parseInt(paddedHours, 10);
    const m = parseInt(minutes, 10);
    const s = parseInt(seconds, 10);

    if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
      throw new Error(`Invalid ${fieldName} value: ${timeStr}`);
    }

    return `${paddedHours}:${minutes}:${seconds}`;
  }

  /**
   * Validate that clock out time is after clock in time
   */
  private validateTimeOrder(clockIn: string, clockOut: string): void {
    const [inH, inM, inS] = clockIn.split(':').map(Number);
    const [outH, outM, outS] = clockOut.split(':').map(Number);

    const inSeconds = inH * 3600 + inM * 60 + inS;
    const outSeconds = outH * 3600 + outM * 60 + outS;

    if (outSeconds <= inSeconds) {
      throw new Error(
        `Clock Out time (${clockOut}) must be after Clock In time (${clockIn})`,
      );
    }
  }

  /**
   * Generate a template Excel file for HR to fill
   */
  generateTemplate(): Buffer {
    const data = [
      {
        'Employee ID': 1,
        Date: '2025-11-06',
        'Clock In': '09:00:00',
        'Clock Out': '17:30:00',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Employee ID
      { wch: 12 }, // Date
      { wch: 10 }, // Clock In
      { wch: 10 }, // Clock Out
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
