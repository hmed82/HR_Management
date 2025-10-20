import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

// Determine status based on presence of clockIn & clockOut.
// COMPLETE when both exist and non-empty;
// INCOMPLETE when either is missing or empty.
// INVALID when clockOut is earlier than or equal to clockIn or not a valid date.
export function determineStatusFromClocks(
  clockIn?: string | null,
  clockOut?: string | null,
): TimeEntryStatus {
  const hasClockIn = !!clockIn && clockIn.trim() !== '';
  const hasClockOut = !!clockOut && clockOut.trim() !== '';

  if (!hasClockIn || !hasClockOut) {
    return TimeEntryStatus.INCOMPLETE;
  }

  const inTime = new Date(clockIn);
  const outTime = new Date(clockOut);

  if (
    isNaN(inTime.getTime()) ||
    isNaN(outTime.getTime()) ||
    outTime <= inTime
  ) {
    return TimeEntryStatus.INVALID;
  }

  return TimeEntryStatus.COMPLETE;
}

// Normalize time strings read from Excel (accept e.g. "08:30", "8:30 AM", "08:30:00").
// Returns HH:mm:ss or null if can't parse.
export function normalizeTimeString(raw?: any): string | null {
  if (!raw && raw !== 0) return null;
  const s = String(raw).trim();

  // If already HH:mm:ss or HH:mm, try to normalize
  const hhmmss = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(:([0-5][0-9]))?$/;
  if (hhmmss.test(s)) {
    const parts = s.split(':');
    const hh = parts[0].padStart(2, '0');
    const mm = parts[1].padStart(2, '0');
    const ss = parts[2] ? parts[2].padStart(2, '0') : '00';
    return `${hh}:${mm}:${ss}`;
  }

  // Try Date parse (Excel may export times as numbers or dates)
  const maybeDate = new Date(s);
  if (!isNaN(maybeDate.getTime())) {
    const hh = String(maybeDate.getHours()).padStart(2, '0');
    const mm = String(maybeDate.getMinutes()).padStart(2, '0');
    const ss = String(maybeDate.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return null;
}
