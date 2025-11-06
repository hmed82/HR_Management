import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

export interface TimeEntryStatistics {
  total: number;
  byStatus: Array<{
    status: TimeEntryStatus;
    count: number;
  }>;
}
