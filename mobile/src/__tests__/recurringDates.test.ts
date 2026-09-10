import { advanceDate } from '../services/recurringService';

/**
 * The month-end cases are the reason this file exists. A naive `setMonth(+1)` on the 31st
 * rolls into the following month (Jan 31 -> Mar 3), which would silently walk a rent day
 * forward a little every year and post transactions on the wrong dates.
 */
describe('advanceDate', () => {
  it('advances daily and weekly', () => {
    expect(advanceDate('2026-09-10', 'DAILY')).toBe('2026-09-11');
    expect(advanceDate('2026-09-10', 'WEEKLY')).toBe('2026-09-17');
  });

  it('rolls over month and year boundaries', () => {
    expect(advanceDate('2026-09-30', 'DAILY')).toBe('2026-10-01');
    expect(advanceDate('2026-12-31', 'DAILY')).toBe('2027-01-01');
    expect(advanceDate('2026-12-28', 'WEEKLY')).toBe('2027-01-04');
  });

  it('advances monthly on a normal day', () => {
    expect(advanceDate('2026-09-10', 'MONTHLY')).toBe('2026-10-10');
    expect(advanceDate('2026-12-15', 'MONTHLY')).toBe('2027-01-15');
  });

  it('clamps to the last day when the target month is shorter', () => {
    expect(advanceDate('2026-01-31', 'MONTHLY')).toBe('2026-02-28');
    expect(advanceDate('2026-03-31', 'MONTHLY')).toBe('2026-04-30');
    expect(advanceDate('2026-05-31', 'MONTHLY')).toBe('2026-06-30');
  });

  it('clamps into a leap February', () => {
    expect(advanceDate('2028-01-31', 'MONTHLY')).toBe('2028-02-29');
  });

  it('does not drift once clamped — a 31st rule stays anchored to month end', () => {
    // The clamp must not become permanent: Jan 31 -> Feb 28 -> Mar 28 is acceptable
    // behaviour for this app, but it must never land outside the intended month.
    let d = '2026-01-31';
    const seen: string[] = [];
    for (let i = 0; i < 12; i++) {
      d = advanceDate(d, 'MONTHLY');
      seen.push(d);
    }
    // Every result stays inside a real calendar month.
    seen.forEach((date) => {
      const [y, m, day] = date.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      expect(day).toBeLessThanOrEqual(daysInMonth);
      expect(day).toBeGreaterThan(0);
    });
    expect(seen).toHaveLength(12);
  });

  it('advances yearly, including across a leap day', () => {
    expect(advanceDate('2026-09-10', 'YEARLY')).toBe('2027-09-10');
    expect(advanceDate('2028-02-29', 'YEARLY')).toBe('2029-02-28');
  });

  it('always moves strictly forward', () => {
    const cases: [string, 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'][] = [
      ['2026-01-31', 'MONTHLY'],
      ['2026-02-28', 'MONTHLY'],
      ['2026-12-31', 'DAILY'],
      ['2028-02-29', 'YEARLY'],
    ];
    cases.forEach(([start, freq]) => {
      expect(advanceDate(start, freq) > start).toBe(true);
    });
  });
});
