import { parse } from 'csv-parse/sync';
import iconv from 'iconv-lite';
import { AppError } from '../../../shared/errors/app-error.js';
import { ErrorCode } from '../../../shared/errors/error-codes.js';
import { detectBankFormat } from './formats/index.js';
import type { ParsedCsv, RawCsvRow } from './csv.types.js';

const MAX_ROWS = 10_000;

/**
 * Decodes the buffer to a UTF-8 string.
 * Israeli bank exports may use Windows-1255 (Hebrew) encoding.
 * We detect non-UTF-8 content by checking for U+FFFD replacement characters.
 */
const decodeBuffer = (buffer: Buffer): string => {
  const utf8 = buffer.toString('utf-8');
  // Replacement character signals invalid UTF-8 byte sequences (e.g. cp1255)
  if (utf8.includes('\uFFFD')) {
    return iconv.decode(buffer, 'cp1255');
  }
  return utf8;
};

/**
 * Infers the column delimiter from the first line of the CSV.
 * Semicolons are dominant in Russian bank exports; commas elsewhere.
 */
const inferDelimiter = (firstLine: string): string => {
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ';' : ',';
};

/**
 * Parses a raw CSV buffer into structured rows.
 * Responsibilities:
 *   - Encoding detection and conversion
 *   - Delimiter inference
 *   - Bank format auto-detection
 * Does NOT apply any business normalization — that is the normalizer's job.
 */
export const parseCsvBuffer = (buffer: Buffer): ParsedCsv => {
  const content = decodeBuffer(buffer);
  const firstLine = content.split('\n')[0] ?? '';
  const delimiter = inferDelimiter(firstLine);

  // Parse without relax_column_count so csv-parse rejects rows whose column
  // count diverges from the header row — silent column drift stops here.
  let rows: RawCsvRow[];
  try {
    rows = parse(content, {
      delimiter,
      columns: true,        // use first row as column headers
      skip_empty_lines: true,
      trim: true,
      bom: true,            // strip BOM if present
      // relax_column_count intentionally omitted: column drift must be explicit.
    }) as RawCsvRow[];
  } catch (cause) {
    throw AppError.badRequest(ErrorCode.INVALID_CSV, 'Failed to parse CSV file', { cause });
  }

  if (rows.length === 0) {
    throw AppError.badRequest(ErrorCode.EMPTY_CSV, 'CSV file contains no data rows');
  }

  if (rows.length > MAX_ROWS) {
    throw AppError.badRequest(
      ErrorCode.INVALID_CSV,
      `CSV exceeds the maximum of ${MAX_ROWS} rows per import`,
    );
  }

  const headers = Object.keys(rows[0] ?? {});

  // Guard against a missing header row: when the first line is a data row
  // rather than column names, csv-parse promotes it to headers and every
  // subsequent row is interpreted with shifted columns. Detect this by
  // checking whether ALL header values look purely numeric/date-like —
  // no real column header should match that pattern.
  const looksLikeDataRow = headers.length > 0 && headers.every((h) => /^[\d.,:/ -]+$/.test(h));
  if (looksLikeDataRow) {
    throw AppError.badRequest(
      ErrorCode.INVALID_CSV,
      'CSV appears to be missing a header row — the first line looks like data, not column names',
    );
  }
  const detectedFormat = detectBankFormat(headers);

  return { rows, headers, detectedFormat };
};
