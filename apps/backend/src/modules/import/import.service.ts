import { randomUUID } from 'crypto';
import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import { parseCsvBuffer } from './csv/csv-parser.js';
import { normalizeTransactions } from './csv/csv-normalizer.js';
import type { NormalizedTransaction } from './csv/csv.types.js';
import type { ImportJob, ImportJobStatus, StartImportOptions } from './import.types.js';

const BATCH_SIZE = 100;

/**
 * In-memory job store.
 * Sufficient for a single-process deployment. Replace with Redis-backed
 * queue (e.g. BullMQ) if horizontal scaling is needed.
 */
const jobs = new Map<string, ImportJob>();

const updateJob = (job: ImportJob, patch: Partial<ImportJob>): void => {
  Object.assign(job, patch);
};

/** Fetches all existing importHash values for a family to enable dedup. */
const fetchExistingHashes = async (familyId: string): Promise<Set<string>> => {
  const rows = await prisma.transaction.findMany({
    where: { familyId, importHash: { not: null } },
    select: { importHash: true },
  });
  return new Set(rows.map((r: { importHash: string | null }) => r.importHash as string));
};

/** Inserts transactions in fixed-size batches to avoid overwhelming the DB. */
const batchInsert = async (
  transactions: NormalizedTransaction[],
  { accountId, userId, familyId }: Pick<StartImportOptions, 'accountId' | 'userId' | 'familyId'>,
): Promise<void> => {
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    await prisma.transaction.createMany({
      data: batch.map((t) => ({
        amount: t.amount,
        currency: t.currency,
        type: t.type,
        source: 'CSV_IMPORT' as const,
        description: t.description,
        merchant: t.merchant,
        date: t.date,
        importHash: t.importHash,
        accountId,
        userId,
        familyId,
      })),
      // Handles race conditions when two imports run concurrently
      skipDuplicates: true,
    });
  }
};

/**
 * Core import pipeline. Runs asynchronously after the HTTP response has been
 * sent with the job ID. Updates the job record in-place so polling works.
 */
const processImport = async (
  fileBuffer: Buffer,
  options: StartImportOptions,
  job: ImportJob,
): Promise<void> => {
  updateJob(job, { status: 'PROCESSING' });

  try {
    // Step 1: Parse
    const parsed = parseCsvBuffer(fileBuffer);
    updateJob(job, { totalRows: parsed.rows.length });

    // Step 2: Normalize
    const { transactions, errors } = normalizeTransactions(parsed);
    updateJob(job, { failedRows: errors.length, errors });

    // Step 3: Deduplicate against existing data
    const existingHashes = await fetchExistingHashes(options.familyId);
    const newTransactions = transactions.filter((t) => !existingHashes.has(t.importHash));
    updateJob(job, { skippedRows: transactions.length - newTransactions.length });

    // Step 4: Persist
    await batchInsert(newTransactions, options);
    updateJob(job, {
      status: 'COMPLETED',
      importedRows: newTransactions.length,
      completedAt: new Date(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error during import';
    updateJob(job, {
      status: 'FAILED',
      errors: [{ row: 0, message }],
      completedAt: new Date(),
    });
    // Re-throw so the unhandled rejection is visible in logs
    throw err;
  }
};

export const importService = {
  /**
   * Creates a job record, starts the import pipeline in the background,
   * and returns the job immediately so the caller can return 202.
   */
  start(fileBuffer: Buffer, options: StartImportOptions): ImportJob {
    const jobId = randomUUID();
    const job: ImportJob = {
      jobId,
      status: 'PENDING',
      totalRows: 0,
      importedRows: 0,
      skippedRows: 0,
      failedRows: 0,
      errors: [],
      completedAt: null,
    };

    jobs.set(jobId, job);

    // Fire-and-forget — errors are captured inside processImport
    void processImport(fileBuffer, options, job);

    return job;
  },

  getJob(jobId: string): ImportJob | null {
    return jobs.get(jobId) ?? null;
  },
};
