export interface TimeEntryStatistics {
  total: number;
  byStatus: Array<{
    status: string;
    count: number;
  }>;
}