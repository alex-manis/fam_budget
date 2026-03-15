import { describe, it, expect } from 'vitest';
import { normalizeTransactions } from './csv-normalizer.js';
import type { ParsedCsv } from './csv.types.js';

// Leumi format column names (from leumi.format.ts):
//   תאריך  → date
//   חיוב   → debit/amount (required for amount)
//   פירוט  → description
//   זכות   → credit (income side)
const leumiHeaders = ['תאריך', 'תאריך ערך', 'פירוט', 'חיוב', 'זכות', 'יתרה'];

// Builds a leumi-style expense row (חיוב = debit).
const expenseRow = (date: string, amount: string, description: string, merchant = ''): Record<string, string> => ({
  'תאריך': date,
  'תאריך ערך': date,
  'פירוט': description,
  'חיוב': amount,
  'זכות': '',
  'יתרה': '',
  ...(merchant ? { 'בית עסק': merchant } : {}),
});

const leumi = (rows: Record<string, string>[]): ParsedCsv => ({
  rows,
  headers: leumiHeaders,
  detectedFormat: 'leumi',
});

// ─── computeImportHash stability ───────────────────────────────────────────

describe('computeImportHash', () => {
  it('produces the same hash for two identical rows (dedup baseline)', () => {
    const row = expenseRow('01/01/2024', '100', 'test');
    const { transactions } = normalizeTransactions(leumi([row, { ...row }]));
    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.importHash).toBe(transactions[1]?.importHash);
  });

  it('produces different hashes for same date/amount but different descriptions', () => {
    const { transactions } = normalizeTransactions(leumi([
      expenseRow('15/06/2024', '50', 'Merchant A'),
      expenseRow('15/06/2024', '50', 'Merchant B'),
    ]));
    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.importHash).not.toBe(transactions[1]?.importHash);
  });

  it('produces the same hash whether amount is "100" or "100.00" (canonical decimals)', () => {
    const { transactions } = normalizeTransactions(leumi([
      expenseRow('01/03/2024', '100', 'shop'),
      expenseRow('01/03/2024', '100.00', 'shop'),
    ]));
    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.importHash).toBe(transactions[1]?.importHash);
  });

  it('different transactions with empty description and different amounts hash differently', () => {
    const { transactions } = normalizeTransactions(leumi([
      expenseRow('01/03/2024', '50', ''),
      expenseRow('01/03/2024', '60', ''),
    ]));
    expect(transactions).toHaveLength(2);
    expect(transactions[0]?.importHash).not.toBe(transactions[1]?.importHash);
  });
});

// ─── Zero-amount guard ──────────────────────────────────────────────────────

describe('zero-amount guard', () => {
  it('rejects rows with amount 0 as an error, not as a transaction', () => {
    // לאומי: חיוב=0 and זכות=0 → normalizeAmount returns amount "0.00"
    const { transactions, errors } = normalizeTransactions(leumi([
      { 'תאריך': '01/01/2024', 'תאריך ערך': '', 'פירוט': 'phantom', 'חיוב': '0', 'זכות': '', 'יתרה': '' },
      expenseRow('01/01/2024', '50', 'real'),
    ]));
    expect(transactions).toHaveLength(1);
    expect(transactions[0]?.description).toBe('real');
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/zero/i);
  });
});

// ─── Missing header row detection ──────────────────────────────────────────

describe('assertRequiredColumnsPresent', () => {
  it('throws when required columns are absent from headers', () => {
    // Simulate a leumi CSV where the header row is missing:
    // csv-parse promoted the first data row as headers, so the column names
    // the format expects (חיוב, פירוט) are absent.
    const parsed: ParsedCsv = {
      rows: [{ '01/01/2024': '100', '100': 'text', 'text': '' }],
      headers: ['01/01/2024', '100', 'text'],
      detectedFormat: 'leumi',
    };
    expect(() => normalizeTransactions(parsed)).toThrow(/missing required columns/i);
  });
});

// ─── Malformed row (column count mismatch) ──────────────────────────────────

describe('malformed row handling', () => {
  it('collects a per-row error when required column key is absent from the row object', () => {
    // Simulate a row that arrived without the date key — as would happen with
    // a short row if relax_column_count were re-enabled.
    const parsed: ParsedCsv = {
      rows: [
        { 'חיוב': '50', 'פירוט': 'incomplete', 'זכות': '', 'יתרה': '' } as Record<string, string>,
      ],
      headers: leumiHeaders,
      detectedFormat: 'leumi',
    };
    const { transactions, errors } = normalizeTransactions(parsed);
    expect(transactions).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/fewer columns/i);
  });
});
