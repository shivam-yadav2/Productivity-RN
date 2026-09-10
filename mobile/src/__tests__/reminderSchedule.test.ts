import { nextOccurrences, describeSchedule } from '../services/reminderService';
import { Reminder } from '../types';

/**
 * Repeating alarms are expanded into a fixed run of individual OS alarms, so this
 * function decides exactly when the phone rings. Getting it wrong means an alarm that
 * fires on the wrong day, or one that never fires at all.
 */

function makeReminder(over: Partial<Reminder> = {}): Reminder {
  return {
    id: 'rem_test',
    title: 'Test',
    time: '07:00',
    repeat: 'DAILY',
    style: 'ALARM',
    snoozeMinutes: 5,
    isEnabled: true,
    createdAt: '2026-09-10T00:00:00.000Z',
    updatedAt: '2026-09-10T00:00:00.000Z',
    ...over,
  };
}

// 2026-09-10 is a Thursday. Fixed so weekday assertions are stable.
const NOW = new Date(2026, 8, 10, 9, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('nextOccurrences', () => {
  it('returns nothing for a one-off already in the past', () => {
    const r = makeReminder({ repeat: 'ONCE', date: '2026-09-01', time: '07:00' });
    expect(nextOccurrences(r, 5)).toEqual([]);
  });

  it('returns the single moment for a future one-off', () => {
    const r = makeReminder({ repeat: 'ONCE', date: '2026-09-12', time: '18:30' });
    const out = nextOccurrences(r, 5);
    expect(out).toHaveLength(1);
    const d = new Date(out[0]);
    expect(d.getDate()).toBe(12);
    expect(d.getHours()).toBe(18);
    expect(d.getMinutes()).toBe(30);
  });

  it('skips today for a daily reminder whose time has already passed', () => {
    // It is 09:00; a 07:00 daily alarm should start tomorrow, not fire immediately.
    const r = makeReminder({ repeat: 'DAILY', time: '07:00' });
    const out = nextOccurrences(r, 3);
    expect(new Date(out[0]).getDate()).toBe(11);
    expect(out).toHaveLength(3);
  });

  it('includes today for a daily reminder still ahead', () => {
    const r = makeReminder({ repeat: 'DAILY', time: '22:00' });
    const out = nextOccurrences(r, 2);
    expect(new Date(out[0]).getDate()).toBe(10);
  });

  it('every occurrence is strictly in the future and ascending', () => {
    const r = makeReminder({ repeat: 'DAILY', time: '07:00' });
    const out = nextOccurrences(r, 14);
    expect(out).toHaveLength(14);
    out.forEach((t) => expect(t).toBeGreaterThan(NOW.getTime()));
    for (let i = 1; i < out.length; i++) {
      expect(out[i]).toBeGreaterThan(out[i - 1]);
    }
  });

  it('WEEKDAYS never lands on a weekend', () => {
    const r = makeReminder({ repeat: 'WEEKDAYS', time: '07:00' });
    nextOccurrences(r, 12).forEach((t) => {
      const day = new Date(t).getDay();
      expect(day).not.toBe(0); // Sunday
      expect(day).not.toBe(6); // Saturday
    });
  });

  it('CUSTOM only lands on the chosen weekdays', () => {
    // Monday (1) and Friday (5) only.
    const r = makeReminder({ repeat: 'CUSTOM', days: [1, 5], time: '07:00' });
    const out = nextOccurrences(r, 6);
    expect(out).toHaveLength(6);
    out.forEach((t) => expect([1, 5]).toContain(new Date(t).getDay()));
  });

  it('CUSTOM with no days selected produces nothing rather than firing daily', () => {
    const r = makeReminder({ repeat: 'CUSTOM', days: [], time: '07:00' });
    expect(nextOccurrences(r, 5)).toEqual([]);
  });
});

describe('describeSchedule', () => {
  it('describes each repeat mode', () => {
    expect(describeSchedule(makeReminder({ repeat: 'DAILY', time: '07:00' }))).toMatch(/Every day/);
    expect(describeSchedule(makeReminder({ repeat: 'WEEKDAYS' }))).toMatch(/Weekdays/);
    expect(describeSchedule(makeReminder({ repeat: 'CUSTOM', days: [1, 5] }))).toMatch(/Mon, Fri/);
    expect(
      describeSchedule(makeReminder({ repeat: 'ONCE', date: '2026-09-12' }))
    ).toMatch(/Sep 12/);
  });
});
