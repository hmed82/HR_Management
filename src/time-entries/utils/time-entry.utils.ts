import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

// Convert an "HH:mm:ss" (or "HH:mm") time string into seconds since midnight.
// Returns null when the value can't be parsed.
function toSecondsOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(time.trim());
  if (!match) return null;

  const h = Number(match[1]);
  const m = Number(match[2]);
  const s = Number(match[3] ?? 0);

  if (h > 23 || m > 59 || s > 59) return null;
  if (isNaN(h) || isNaN(m) || isNaN(s)) return null;

  return h * 3600 + m * 60 + s;
}

// Determine status based on presence of clockIn & clockOut.
// COMPLETE when both exist and non-empty (and clockOut is after clockIn);
// INCOMPLETE when either is missing or empty;
// INVALID when clockOut is earlier than or equal to clockIn (or not a valid time).
// NOTE: We deliberately compare clock times as "seconds since midnight" instead of
// `new Date(clockIn)` because Node cannot safely parse a bare "HH:mm:ss" string
// (`new Date('09:00:00')` returns Invalid Date), which used to mark valid
// entries as INVALID.
export function determineStatusFromClocks(
  clockIn?: string | null,
  clockOut?: string | null,
): TimeEntryStatus {
  const hasClockIn = !!clockIn && clockIn.trim() !== '';
  const hasClockOut = !!clockOut && clockOut.trim() !== '';

  if (!hasClockIn || !hasClockOut) {
    return TimeEntryStatus.INCOMPLETE;
  }

  const inSeconds = toSecondsOfDay(clockIn);
  const outSeconds = toSecondsOfDay(clockOut);

  if (inSeconds === null || outSeconds === null || outSeconds <= inSeconds) {
    return TimeEntryStatus.INVALID;
  }

  return TimeEntryStatus.COMPLETE;
}
