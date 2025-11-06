export interface BulkImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{
    employeeId: number;
    date: string;
    error: string;
  }>;
}
