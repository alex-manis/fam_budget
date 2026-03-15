import { z } from 'zod';

export const importCsvBodySchema = z.object({
  accountId: z.string().min(1, 'accountId is required'),
  format: z.enum(['poalim', 'leumi', 'isracard', 'generic']).optional(),
});

export type ImportCsvBody = z.infer<typeof importCsvBodySchema>;
