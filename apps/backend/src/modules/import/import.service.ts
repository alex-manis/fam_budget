import { randomUUID } from 'crypto';
import { prisma } from '../../infrastructure/prisma/prisma.client.js';
import { parseCsvBuffer } from './csv/csv-parser.js';
import { normalizeTransactions } from './csv/csv-normalizer.js';
import { classifyBatch } from '../ai/classification/classifier.service.js';
import type { NormalizedTransaction } from './csv/csv.types.js';
import type { ClassificationResult } from '../ai/classification/classification.types.js';
import type { ImportJob, StartImportOptions } from './import.types.js';

const BATCH_SIZE = 100;

const jobs = new Map<string, ImportJob>();

const updateJob = (job: ImportJob, patch: Partial<ImportJob>): void => {
  Object.assign(job, patch);
};

const fetchExistingHashes = async (familyId: string): Promise<Set<string>> => {
  const rows = await prisma.transaction.findMany({
    where: { familyId, importHash: { not: null } },
    select: { importHash: true },
  });
  return new Set(rows.map((r: { importHash: string | null }) => r.importHash as string));
};

/**
 * Fetches all categories for the family + system categories and returns
 * a Map<lowerCaseName, id> for fast O(1) lookups during batch insert.
 */
const buildCategoryMap = async (familyId: string): Promise<Map<string, string>> => {
  const categories = await prisma.category.findMany({
    where: { OR: [{ isSystem: true }, { familyId }] },
    select: { id: true, name: true },
  });
  return new Map(categories.map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id]));
};

interface EnrichedTransaction extends NormalizedTransaction {
  categoryId: string | null;
  isAiClassified: boolean;
}

/** Merges normalized transaction with its classification result. */
const enrich = (
  transaction: NormalizedTransaction,
  classification: ClassificationResult,
  categoryMap: Map<string, string>,
): EnrichedTransaction => ({
  ...transaction,
  categoryId: categoryMap.get(classification.categoryName.toLowerCase()) ?? null,
  isAiClassified: classification.source === 'ai',
});

const batchInsert = async (
  transactions: EnrichedTransaction[],
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
        categoryId: t.categoryId,
        isAiClassified: t.isAiClassified,
        accountId,
        userId,
        familyId,
      })),
      skipDuplicates: true,
    });
  }
};

const processImport = async (
  fileBuffer: Buffer,
  options: StartImportOptions,
  job: ImportJob,
): Promise<void> => {
  updateJob(job, { status: 'PROCESSING' });

  try {
    // Step 1: Parse CSV
    const parsed = parseCsvBuffer(fileBuffer);
    updateJob(job, { totalRows: parsed.rows.length });

    // Step 2: Normalize rows
    const { transactions, errors } = normalizeTransactions(parsed);
    updateJob(job, { failedRows: errors.length, errors });

    // Step 3: Deduplicate
    const existingHashes = await fetchExistingHashes(options.familyId);
    const newTransactions = transactions.filter((t) => !existingHashes.has(t.importHash));
    updateJob(job, { skippedRows: transactions.length - newTransactions.length });

    // Step 4: Classify (rule engine first, AI fallback only when needed)
    const classificationInputs = newTransactions.map((t) => ({
      description: t.description ?? '',
      merchant: t.merchant,
      amount: parseFloat(t.amount),
      date: t.date,
    }));
    const classifications = await classifyBatch(classificationInputs);

    // Step 5: Enrich with categoryId from DB
    const categoryMap = await buildCategoryMap(options.familyId);
    const enriched = newTransactions.map((t, i) =>
      enrich(t, classifications[i] ?? { categoryName: 'Other', confidence: 0, isEssential: false, isRecurring: false, explanation: '', source: 'fallback' }, categoryMap),
    );

    // Step 6: Persist
    await batchInsert(enriched, options);
    updateJob(job, {
      status: 'COMPLETED',
      importedRows: enriched.length,
      completedAt: new Date(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error during import';
    updateJob(job, {
      status: 'FAILED',
      errors: [{ row: 0, message }],
      completedAt: new Date(),
    });
    throw err;
  }
};

export const importService = {
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
    void processImport(fileBuffer, options, job);
    return job;
  },

  getJob(jobId: string): ImportJob | null {
    return jobs.get(jobId) ?? null;
  },
};
