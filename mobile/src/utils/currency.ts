/**
 * Currency utilities for strict integer minor units (paise/cents).
 * e.g., ₹450.50 is stored as 45050 paise.
 */

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2 },
};

export const DEFAULT_CURRENCY = 'INR';

/**
 * Converts major units string or number (e.g., "450.50" or 450.5) to integer minor units (e.g. 45050).
 */
export function toMinorUnits(amount: number | string, decimals = 2): number {
  if (typeof amount === 'string') {
    const clean = amount.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * Math.pow(10, decimals));
  }
  if (isNaN(amount)) return 0;
  return Math.round(amount * Math.pow(10, decimals));
}

/**
 * Converts integer minor units (e.g., 45050) to major units float (e.g., 450.50).
 */
export function toMajorUnits(minorAmount: number, decimals = 2): number {
  if (!minorAmount || isNaN(minorAmount)) return 0;
  return minorAmount / Math.pow(10, decimals);
}

/**
 * Formats minor units into user-friendly localized string.
 * Example: 45050 paise -> "₹450.50" or "₹450" if round.
 */
export function formatCurrency(
  minorAmount: number,
  currencyCode = DEFAULT_CURRENCY,
  options: { showSymbol?: boolean; showDecimals?: boolean; compact?: boolean } = {}
): string {
  const { showSymbol = true, showDecimals = false, compact = false } = options;
  const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES.INR;
  const major = toMajorUnits(minorAmount, config.decimals);

  if (compact && Math.abs(major) >= 10000000) {
    const cr = (major / 10000000).toFixed(1);
    return `${showSymbol ? config.symbol : ''}${cr} Cr`;
  }
  if (compact && Math.abs(major) >= 100000) {
    const lk = (major / 100000).toFixed(1);
    return `${showSymbol ? config.symbol : ''}${lk} L`;
  }
  if (compact && Math.abs(major) >= 1000) {
    const k = (major / 1000).toFixed(1);
    return `${showSymbol ? config.symbol : ''}${k}k`;
  }

  // Format with standard Indian/International grouping
  const isWhole = major % 1 === 0;
  const minimumFractionDigits = showDecimals ? config.decimals : isWhole ? 0 : config.decimals;
  const maximumFractionDigits = config.decimals;

  try {
    const formatted = new Intl.NumberFormat(currencyCode === 'INR' ? 'en-IN' : 'en-US', {
      style: 'decimal',
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(major);

    return showSymbol ? `${config.symbol}${formatted}` : formatted;
  } catch {
    return `${showSymbol ? config.symbol : ''}${major.toFixed(config.decimals)}`;
  }
}
