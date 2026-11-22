import { formatDate, formatRelativeTime } from '../../utils/date';

describe('formatDate', () => {
  it('returns a fallback for empty values', () => {
    expect(formatDate(null)).toBe('No date');
    expect(formatDate('')).toBe('No date');
  });

  it('formats iso strings and timestamps as yyyy-mm-dd', () => {
    expect(formatDate('2024-03-15T10:30:00.000Z')).toBe('2024-03-15');
    expect(formatDate(Date.UTC(2024, 0, 2, 12))).toBe('2024-01-02');
  });

  it('returns the raw value when it cannot be parsed', () => {
    expect(formatDate('not a date')).toBe('not a date');
  });
});

describe('formatRelativeTime', () => {
  const now = Date.UTC(2024, 5, 1, 12, 0, 0);

  beforeEach(() => {
    jest.spyOn(Date, 'now').mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns Never when there is no timestamp', () => {
    expect(formatRelativeTime(null)).toBe('Never');
  });

  it('uses short relative labels for recent times', () => {
    expect(formatRelativeTime(now - 5000)).toBe('Just now');
    expect(formatRelativeTime(now - 30000)).toBe('30s ago');
    expect(formatRelativeTime(now - 5 * 60000)).toBe('5m ago');
    expect(formatRelativeTime(now - 3 * 3600000)).toBe('3h ago');
  });

  it('falls back to the date after a day', () => {
    expect(formatRelativeTime(now - 2 * 86400000)).toBe('2024-05-30');
  });
});
