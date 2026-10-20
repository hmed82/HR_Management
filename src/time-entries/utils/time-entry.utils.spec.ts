import { determineStatusFromClocks } from './time-entry.utils';
import { TimeEntryStatus } from '@/time-entries/enum/time-entry-status.enum';

describe('determineStatusFromClocks', () => {
  it('returns COMPLETE when both clocks exist and clockOut is after clockIn', () => {
    expect(determineStatusFromClocks('09:00:00', '17:30:00')).toBe(
      TimeEntryStatus.COMPLETE,
    );
  });

  it('returns COMPLETE for HH:mm format too', () => {
    expect(determineStatusFromClocks('09:00', '17:30')).toBe(
      TimeEntryStatus.COMPLETE,
    );
  });

  it('returns INCOMPLETE when clockOut is missing', () => {
    expect(determineStatusFromClocks('09:00:00', null)).toBe(
      TimeEntryStatus.INCOMPLETE,
    );
    expect(determineStatusFromClocks('09:00:00', '')).toBe(
      TimeEntryStatus.INCOMPLETE,
    );
  });

  it('returns INCOMPLETE when clockIn is missing', () => {
    expect(determineStatusFromClocks(null, '17:30:00')).toBe(
      TimeEntryStatus.INCOMPLETE,
    );
  });

  it('returns INVALID when clockOut is before clockIn', () => {
    expect(determineStatusFromClocks('10:00:00', '09:00:00')).toBe(
      TimeEntryStatus.INVALID,
    );
  });

  it('returns INVALID when clockOut equals clockIn', () => {
    expect(determineStatusFromClocks('09:00:00', '09:00:00')).toBe(
      TimeEntryStatus.INVALID,
    );
  });

  it('never throws on unparseable values (regression: new Date("HH:mm:ss") is Invalid Date in Node)', () => {
    // used to be marked INVALID because `new Date('09:00:00')` is Invalid Date
    expect(determineStatusFromClocks('09:00:00', '17:30:00')).toBe(
      TimeEntryStatus.COMPLETE,
    );
    expect(determineStatusFromClocks('garbage', '17:30:00')).toBe(
      TimeEntryStatus.INVALID,
    );
  });
});
