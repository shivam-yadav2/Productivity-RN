/**
 * Importer for Money Manager (the Android expense app) spreadsheet exports.
 *
 * Money Manager's "Export to Excel" produces one row per transaction with these columns:
 *
 *   Date | Account | Category | Subcategory | Note | INR | Income/Expense | Description | Amount | Currency | Account
 *
 * Quirks this handles:
 *  - `Date` is an Excel serial number carrying both date and time.
 *  - `Category` doubles as the *destination account* on `Transfer-Out` rows.
 *  - Category names are prefixed with an emoji ("🍜 Food").
 *  - Account names may carry stray whitespace ("Indus ").
 *  - Both `Transfer-Out` and `Transfer-In` may appear for a single move; only the
 *    Out side is imported so the transfer isn't counted twice.
 */
import * as XLSX from 'xlsx';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { dbEngine } from '../database/db';
import { Account, AccountType, Category, Transaction } from '../types';
import { toMinorUnits } from '../utils/currency';

export interface ImportSummary {
  success: boolean;
  message: string;
  imported: number;
  duplicates: number;
  skipped: number;
  accountsCreated: string[];
  categoriesCreated: string[];
}

interface ParsedRow {
  date: string;
  time: string;
  account: string;
  category: string;
  note: string;
  amountMajor: number;
  kind: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  raw: string;
}

/** Excel serial -> { date, time }, read in UTC so the sheet's literal clock time survives. */
function fromExcelSerial(serial: number): { date: string; time: string } {
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
  };
}

/**
 * True if `cp` is an emoji/pictograph, or the wreckage of one.
 *
 * Money Manager writes emoji into the sheet XML as numeric character references
 * ("&#x1f35c; Food"). SheetJS 0.18.5 decodes those with `String.fromCharCode`, which
 * truncates anything above U+FFFF — so U+1F35C arrives as U+F35C. Every emoji from the
 * common blocks (U+1F300..U+1FAFF) lands mangled in U+E000..U+FAFF, which is Private Use
 * Area plus CJK Compatibility Ideographs: ranges real category names never use. Both the
 * intact and the truncated forms are matched so the names come out clean either way.
 */
function isPictographCodePoint(cp: number): boolean {
  return (
    (cp >= 0x1f000 && cp <= 0x1faff) || // emoji blocks incl. Symbols & Pictographs Extended-A
    (cp >= 0x2600 && cp <= 0x27bf) || // Misc Symbols + Dingbats
    (cp >= 0x1f3fb && cp <= 0x1f3ff) || // skin-tone modifiers
    (cp >= 0xe000 && cp <= 0xfaff) || // truncated emoji (see above): PUA + CJK compat
    cp === 0xfe0f ||
    cp === 0xfe0e || // variation selectors
    cp === 0x200d // zero-width joiner
  );
}

/**
 * Drops emoji from a label, keeping the words ("\u{1F35C} Food" -> "Food").
 *
 * Iterates code points instead of using a /u-flag range regex: bundlers lower
 * `[\u{1F000}-\u{1FAFF}]` into a surrogate-pair character class that matches only half of
 * an astral emoji, leaving a lone surrogate behind.
 */
function stripEmoji(s: string): string {
  let out = '';
  for (const ch of Array.from(s)) {
    if (!isPictographCodePoint(ch.codePointAt(0) ?? 0)) out += ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Notes are free text, so intact emoji are left alone — only the truncated leftovers
 * described above are removed, since those render as unrelated CJK glyphs.
 */
function repairNote(s: string): string {
  let out = '';
  for (const ch of Array.from(s)) {
    const cp = ch.codePointAt(0) ?? 0;
    if (!(cp >= 0xe000 && cp <= 0xfaff)) out += ch;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Stable id from row content so re-importing the same file doesn't duplicate rows. */
function hashId(prefix: string, input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  return `${prefix}${(h >>> 0).toString(36)}`;
}

const ACCOUNT_TYPE_HINTS: { match: RegExp; type: AccountType; icon: string; color: string }[] = [
  { match: /cash|wallet|purse/i, type: 'CASH', icon: 'Banknote', color: '#059669' },
  { match: /credit|card/i, type: 'CREDIT_CARD', icon: 'CreditCard', color: '#db2777' },
  { match: /saving|deposit/i, type: 'SAVINGS', icon: 'Landmark', color: '#4f46e5' },
  { match: /invest|mutual|stock|sip/i, type: 'INVESTMENT', icon: 'TrendingUp', color: '#0891b2' },
  { match: /bank|indus|sbi|hdfc|icici|axis|kotak|account/i, type: 'BANK', icon: 'Building2', color: '#2563eb' },
];

const CATEGORY_ICON_HINTS: { match: RegExp; icon: string; color: string }[] = [
  { match: /food|grocer|restaurant|dining|snack/i, icon: 'UtensilsCrossed', color: '#f43f5e' },
  { match: /transport|travel|commute|fuel|taxi|uber|petrol/i, icon: 'Car', color: '#0ea5e9' },
  { match: /household|home|rent|furnitur/i, icon: 'Home', color: '#8b5cf6' },
  { match: /health|medical|doctor|pharma|gym/i, icon: 'HeartPulse', color: '#10b981' },
  { match: /recharge|phone|mobile|internet|bill|utilit/i, icon: 'Receipt', color: '#f59e0b' },
  { match: /salary|income|bonus|interest/i, icon: 'Coins', color: '#16a34a' },
  { match: /gift|present/i, icon: 'Gift', color: '#ec4899' },
  { match: /social|friend|party/i, icon: 'Users', color: '#6366f1' },
  { match: /culture|movie|entertain|book/i, icon: 'Film', color: '#a855f7' },
  { match: /education|course|school|fee/i, icon: 'GraduationCap', color: '#0284c7' },
];

function pickAccountMeta(name: string) {
  const hit = ACCOUNT_TYPE_HINTS.find((h) => h.match.test(name));
  return hit ?? { type: 'OTHER' as AccountType, icon: 'Wallet', color: '#8A8680' };
}

function pickCategoryMeta(name: string) {
  const hit = CATEGORY_ICON_HINTS.find((h) => h.match.test(name));
  return hit ?? { icon: 'Tag', color: '#8A8680' };
}

/** Reads the workbook into normalised rows, tolerating column reordering. */
export function parseWorkbook(wb: XLSX.WorkBook): { rows: ParsedRow[]; skipped: number } {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: true, defval: '' });
  if (!grid.length) return { rows: [], skipped: 0 };

  const header = (grid[0] as any[]).map((h) => String(h ?? '').trim().toLowerCase());
  const findCol = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const cDate = findCol('date');
  const cAccount = findCol('account');
  const cCategory = findCol('category');
  const cNote = findCol('note', 'description');
  const cType = findCol('income/expense', 'type');
  // Prefer the plain "amount" column; fall back to the currency-named one (e.g. "inr").
  let cAmount = findCol('amount');
  if (cAmount === -1) cAmount = header.findIndex((h) => /^[a-z]{3}$/.test(h));

  if (cDate === -1 || cType === -1 || cAmount === -1) {
    throw new Error(
      'This does not look like a Money Manager export. Expected columns named Date, Income/Expense and Amount.'
    );
  }

  const rows: ParsedRow[] = [];
  let skipped = 0;

  for (let i = 1; i < grid.length; i++) {
    const r = grid[i] as any[];
    if (!r || r.every((c) => c === '' || c == null)) continue;

    const serial = Number(r[cDate]);
    const amountMajor = Math.abs(Number(r[cAmount]));
    const typeRaw = String(r[cType] ?? '').trim().toLowerCase();

    if (!isFinite(serial) || serial <= 0 || !isFinite(amountMajor) || amountMajor <= 0) {
      skipped++;
      continue;
    }

    // Only the "out" leg of a transfer is imported; the matching "in" row would double it.
    if (typeRaw === 'transfer-in') {
      skipped++;
      continue;
    }

    let kind: ParsedRow['kind'];
    if (typeRaw === 'income') kind = 'INCOME';
    else if (typeRaw === 'expense') kind = 'EXPENSE';
    else if (typeRaw.startsWith('transfer')) kind = 'TRANSFER';
    else {
      skipped++;
      continue;
    }

    const { date, time } = fromExcelSerial(serial);
    rows.push({
      date,
      time,
      account: String(r[cAccount] ?? '').trim(),
      category: String(r[cCategory] ?? '').trim(),
      note: repairNote(String(r[cNote] ?? '')),
      amountMajor,
      kind,
      raw: `${serial}|${r[cAccount]}|${r[cCategory]}|${r[cNote]}|${amountMajor}|${typeRaw}`,
    });
  }

  return { rows, skipped };
}

/** Writes parsed rows into the database, creating any missing accounts and categories. */
export function importRows(rows: ParsedRow[], skipped: number): ImportSummary {
  const accountsCreated: string[] = [];
  const categoriesCreated: string[] = [];
  let imported = 0;
  let duplicates = 0;
  let localSkipped = skipped;

  dbEngine.runTransaction((db) => {
    const now = new Date().toISOString();
    const currency = db.settings.currency || 'INR';

    const accountByName = new Map<string, string>();
    Object.values(db.accounts).forEach((a) => accountByName.set(a.name.trim().toLowerCase(), a.id));

    const categoryByKey = new Map<string, string>();
    Object.values(db.categories).forEach((c) =>
      categoryByKey.set(`${c.type}:${c.name.trim().toLowerCase()}`, c.id)
    );

    const ensureAccount = (rawName: string): string => {
      const name = stripEmoji(rawName) || 'Imported Account';
      const key = name.toLowerCase();
      const existing = accountByName.get(key);
      if (existing) return existing;

      const meta = pickAccountMeta(name);
      const id = hashId('acc_mm_', key);
      const account: Account = {
        id,
        name,
        type: meta.type,
        openingBalanceMinor: 0,
        currentBalanceMinor: 0,
        currency,
        icon: meta.icon,
        color: meta.color,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      db.accounts[id] = account;
      accountByName.set(key, id);
      accountsCreated.push(name);
      return id;
    };

    const ensureCategory = (rawName: string, type: 'EXPENSE' | 'INCOME'): string => {
      const name = stripEmoji(rawName) || 'Other';
      const key = `${type}:${name.toLowerCase()}`;
      const existing = categoryByKey.get(key);
      if (existing) return existing;

      const meta = pickCategoryMeta(name);
      const id = hashId('cat_mm_', key);
      const category: Category = {
        id,
        name,
        type,
        icon: meta.icon,
        color: meta.color,
        isArchived: false,
        isDefault: false,
        sortOrder: 900 + categoriesCreated.length,
        createdAt: now,
        updatedAt: now,
      };
      db.categories[id] = category;
      categoryByKey.set(key, id);
      categoriesCreated.push(name);
      return id;
    };

    for (const row of rows) {
      const id = hashId('tx_mm_', row.raw);
      if (db.transactions[id]) {
        duplicates++;
        continue;
      }

      const amountMinor = toMinorUnits(row.amountMajor);
      const accountId = ensureAccount(row.account);

      let tx: Transaction;
      if (row.kind === 'TRANSFER') {
        // On a Transfer-Out row the Category column holds the destination account.
        const destinationAccountId = ensureAccount(row.category);
        if (destinationAccountId === accountId) {
          localSkipped++;
          continue;
        }
        tx = {
          id,
          type: 'TRANSFER',
          amountMinor,
          accountId,
          destinationAccountId,
          date: row.date,
          time: row.time,
          note: row.note || undefined,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        tx = {
          id,
          type: row.kind,
          amountMinor,
          accountId,
          categoryId: ensureCategory(row.category, row.kind),
          date: row.date,
          time: row.time,
          note: row.note || undefined,
          createdAt: now,
          updatedAt: now,
        };
      }

      db.transactions[id] = tx;
      imported++;
    }
  });

  // Balances are derived from the ledger, so recompute once after the bulk insert.
  dbEngine.reconcileAllAccountBalances();

  const parts = [`Imported ${imported} transaction${imported === 1 ? '' : 's'}.`];
  if (duplicates) parts.push(`${duplicates} already present (skipped).`);
  if (localSkipped) parts.push(`${localSkipped} row${localSkipped === 1 ? '' : 's'} unreadable (skipped).`);
  // Deduped for display only: the same label can legitimately exist as both an income
  // and an expense category, and listing it twice just looks like a bug.
  const uniq = (xs: string[]) => Array.from(new Set(xs));
  if (accountsCreated.length) parts.push(`New accounts: ${uniq(accountsCreated).join(', ')}.`);
  if (categoriesCreated.length) parts.push(`New categories: ${uniq(categoriesCreated).join(', ')}.`);

  return {
    success: imported > 0 || duplicates > 0,
    message: parts.join(' '),
    imported,
    duplicates,
    skipped: localSkipped,
    accountsCreated,
    categoriesCreated,
  };
}

const EMPTY: Omit<ImportSummary, 'success' | 'message'> = {
  imported: 0,
  duplicates: 0,
  skipped: 0,
  accountsCreated: [],
  categoriesCreated: [],
};

/** Opens the file picker for a Money Manager .xlsx/.xls/.csv export and imports it. */
export async function pickAndImportMoneyManager(): Promise<ImportSummary> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'text/comma-separated-values',
        '*/*',
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) {
      return { success: false, message: 'No file selected.', ...EMPTY };
    }

    const asset = result.assets[0];
    const file = new File(asset.uri);
    const isCsv = /\.csv$/i.test(asset.name ?? '');

    const wb = isCsv
      ? XLSX.read(await file.text(), { type: 'string' })
      : XLSX.read(await file.base64(), { type: 'base64' });

    const { rows, skipped } = parseWorkbook(wb);
    if (!rows.length) {
      return { success: false, message: 'No importable transactions found in that file.', ...EMPTY };
    }

    return importRows(rows, skipped);
  } catch (error: any) {
    console.error('Money Manager import failed:', error);
    return { success: false, message: error?.message || 'Could not read that file.', ...EMPTY };
  }
}

export const moneyManagerImport = { pickAndImportMoneyManager, parseWorkbook, importRows };
