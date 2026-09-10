import { toMinorUnits, toMajorUnits, formatCurrency } from '../utils/currency';

/**
 * Money is stored as integer minor units everywhere in this app. These tests exist
 * because a rounding slip here silently corrupts every balance in the ledger, and the
 * damage isn't visible until totals stop matching.
 */
describe('toMinorUnits', () => {
  it('converts whole and fractional amounts', () => {
    expect(toMinorUnits(450)).toBe(45000);
    expect(toMinorUnits(450.5)).toBe(45050);
    expect(toMinorUnits('450.50')).toBe(45050);
  });

  it('rounds rather than truncating', () => {
    // 0.1 + 0.2 style float error must not lose a paisa.
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(toMinorUnits(19.999)).toBe(2000);
  });

  it('strips currency symbols and separators from typed input', () => {
    expect(toMinorUnits('₹1,250.75')).toBe(125075);
  });

  it('returns 0 for unparseable input instead of NaN', () => {
    expect(toMinorUnits('abc')).toBe(0);
    expect(toMinorUnits('')).toBe(0);
    expect(toMinorUnits(NaN)).toBe(0);
  });

  it('handles negatives', () => {
    expect(toMinorUnits(-45.5)).toBe(-4550);
  });

  it('respects a non-2-decimal currency', () => {
    // JPY has 0 decimals — 500 yen is 500 minor units, not 50000.
    expect(toMinorUnits(500, 0)).toBe(500);
  });
});

describe('round-tripping', () => {
  it('survives minor -> major -> minor without drift', () => {
    for (const minor of [0, 1, 99, 45050, 123456789]) {
      expect(toMinorUnits(toMajorUnits(minor))).toBe(minor);
    }
  });
});

describe('formatCurrency', () => {
  it('formats with the right symbol', () => {
    expect(formatCurrency(45050, 'INR')).toContain('₹');
    expect(formatCurrency(45050, 'USD')).toContain('$');
  });

  it('falls back to INR for an unknown code rather than throwing', () => {
    expect(() => formatCurrency(1000, 'XXX')).not.toThrow();
  });

  it('compacts large amounts', () => {
    // 1,50,000.00 -> "1.5 L" in the Indian numbering the app uses.
    expect(formatCurrency(15000000, 'INR', { compact: true })).toMatch(/L|Cr/);
  });
});
