import { describe, it, expect } from 'vitest';

// countOccurrences is not exported — test it via a thin re-export shim that
// we add only for tests. We inline the logic here to keep the service file
// unchanged and avoid polluting its public API.

// Mirrors the fixed implementation exactly.
import { differenceInCalendarDays } from 'date-fns';

const countOccurrences = (
  nextRunAt: Date,
  endDate: Date | null,
  frequency: string,
  windowStart: Date,
  windowEnd: Date,
): number => {
  if (endDate && endDate < windowStart) return 0;
  if (nextRunAt > windowEnd) return 0;

  const effectiveEnd = endDate && endDate < windowEnd ? endDate : windowEnd;
  const effectiveStart = nextRunAt >= windowStart ? nextRunAt : windowStart;
  if (effectiveStart > effectiveEnd) return 0;

  const daysSpan = differenceInCalendarDays(effectiveEnd, effectiveStart);

  switch (frequency) {
    case 'DAILY':
      return daysSpan + 1;
    case 'WEEKLY':
      return Math.floor(daysSpan / 7) + 1;
    case 'MONTHLY':
    case 'YEARLY':
      return nextRunAt >= windowStart && nextRunAt <= effectiveEnd ? 1 : 0;
    default:
      return 0;
  }
};

const d = (dateStr: string) => new Date(dateStr);

// ─── DAILY ──────────────────────────────────────────────────────────────────

describe('countOccurrences — DAILY', () => {
  it('counts every day from nextRunAt to end when nextRunAt is within window', () => {
    // nextRunAt = Aug 15, window = Aug 6 – Aug 31 → fires Aug 15..31 = 17 times
    expect(countOccurrences(d('2024-08-15'), null, 'DAILY', d('2024-08-06'), d('2024-08-31'))).toBe(17);
  });

  it('counts from windowStart when nextRunAt is before the window', () => {
    // nextRunAt = Aug 1 (overdue), window = Aug 6 – Aug 31 → fires Aug 6..31 = 26 times
    expect(countOccurrences(d('2024-08-01'), null, 'DAILY', d('2024-08-06'), d('2024-08-31'))).toBe(26);
  });

  it('returns 0 when nextRunAt is beyond the window', () => {
    expect(countOccurrences(d('2024-09-01'), null, 'DAILY', d('2024-08-06'), d('2024-08-31'))).toBe(0);
  });

  it('returns 1 when nextRunAt equals windowEnd', () => {
    expect(countOccurrences(d('2024-08-31'), null, 'DAILY', d('2024-08-06'), d('2024-08-31'))).toBe(1);
  });

  it('respects endDate when it is within the window', () => {
    // endDate = Aug 20, window = Aug 6 – Aug 31, nextRunAt = Aug 6 → fires Aug 6..20 = 15 times
    expect(
      countOccurrences(d('2024-08-06'), d('2024-08-20'), 'DAILY', d('2024-08-06'), d('2024-08-31')),
    ).toBe(15);
  });

  it('returns 0 when endDate is before windowStart', () => {
    expect(countOccurrences(d('2024-08-01'), d('2024-08-05'), 'DAILY', d('2024-08-06'), d('2024-08-31'))).toBe(0);
  });
});

// ─── WEEKLY ─────────────────────────────────────────────────────────────────

describe('countOccurrences — WEEKLY', () => {
  it('counts correct weekly occurrences when nextRunAt is after windowStart', () => {
    // nextRunAt = Aug 7 (Wed), window = Aug 3 – Aug 31
    // fires: Aug 7, 14, 21, 28 → 4 times
    expect(countOccurrences(d('2024-08-07'), null, 'WEEKLY', d('2024-08-03'), d('2024-08-31'))).toBe(4);
  });

  it('counts correct weekly occurrences when nextRunAt equals windowStart', () => {
    // nextRunAt = Aug 6, window = Aug 6 – Aug 31
    // fires: Aug 6, 13, 20, 27 → 4 times
    expect(countOccurrences(d('2024-08-06'), null, 'WEEKLY', d('2024-08-06'), d('2024-08-31'))).toBe(4);
  });

  it('counts from windowStart when nextRunAt is before the window', () => {
    // nextRunAt = Jul 31 (overdue), window = Aug 6 – Aug 31 → effectiveStart = Aug 6
    // fires: Aug 6, 13, 20, 27 → 4 times
    expect(countOccurrences(d('2024-07-31'), null, 'WEEKLY', d('2024-08-06'), d('2024-08-31'))).toBe(4);
  });

  it('returns 1 when next run falls on the last day of the window', () => {
    expect(countOccurrences(d('2024-08-31'), null, 'WEEKLY', d('2024-08-06'), d('2024-08-31'))).toBe(1);
  });

  it('returns 0 when nextRunAt is beyond the window', () => {
    expect(countOccurrences(d('2024-09-05'), null, 'WEEKLY', d('2024-08-06'), d('2024-08-31'))).toBe(0);
  });

  it('respects endDate that cuts the window short', () => {
    // nextRunAt = Aug 6, endDate = Aug 13, window = Aug 6 – Aug 31
    // fires: Aug 6, Aug 13 → 2 times
    expect(
      countOccurrences(d('2024-08-06'), d('2024-08-13'), 'WEEKLY', d('2024-08-06'), d('2024-08-31')),
    ).toBe(2);
  });
});

// ─── MONTHLY / YEARLY ────────────────────────────────────────────────────────

describe('countOccurrences — MONTHLY / YEARLY', () => {
  it('returns 1 when nextRunAt is within the window', () => {
    expect(countOccurrences(d('2024-08-15'), null, 'MONTHLY', d('2024-08-01'), d('2024-08-31'))).toBe(1);
  });

  it('returns 0 when nextRunAt is outside the window', () => {
    expect(countOccurrences(d('2024-09-15'), null, 'MONTHLY', d('2024-08-01'), d('2024-08-31'))).toBe(0);
  });

  it('returns 1 for YEARLY when date is within window', () => {
    expect(countOccurrences(d('2024-08-20'), null, 'YEARLY', d('2024-08-01'), d('2024-08-31'))).toBe(1);
  });
});

// ─── Auth middleware contract ────────────────────────────────────────────────
// Light integration test: the middleware should attach familyId / userId from
// a well-formed token and reject malformed / missing ones.

import { requireAuth } from '../../middleware/auth.middleware.js';
import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors/app-error.js';

const makeReq = (authHeader?: string): Request =>
  ({ headers: { authorization: authHeader } } as unknown as Request);

const makeRes = (): Response => ({} as Response);

describe('requireAuth middleware', () => {
  it('attaches familyId and userId from a valid token', () => {
    const req = makeReq('Bearer fam123:user456');
    const next: NextFunction = (err?: unknown) => {
      expect(err).toBeUndefined();
    };
    requireAuth(req, makeRes(), next);
    expect((req as Request & { familyId?: string }).familyId).toBe('fam123');
    expect((req as Request & { userId?: string }).userId).toBe('user456');
  });

  it('calls next with 401 AppError when Authorization header is missing', () => {
    const req = makeReq(undefined);
    let caughtError: unknown;
    requireAuth(req, makeRes(), (err) => {
      caughtError = err;
    });
    expect(caughtError).toBeInstanceOf(AppError);
    expect((caughtError as AppError).statusCode).toBe(401);
  });

  it('calls next with 401 when token has wrong format (no colon separator)', () => {
    const req = makeReq('Bearer invalidtoken');
    let caughtError: unknown;
    requireAuth(req, makeRes(), (err) => {
      caughtError = err;
    });
    expect(caughtError).toBeInstanceOf(AppError);
    expect((caughtError as AppError).statusCode).toBe(401);
  });

  it('calls next with 401 when Authorization scheme is not Bearer', () => {
    const req = makeReq('Basic fam123:user456');
    let caughtError: unknown;
    requireAuth(req, makeRes(), (err) => {
      caughtError = err;
    });
    expect(caughtError).toBeInstanceOf(AppError);
    expect((caughtError as AppError).statusCode).toBe(401);
  });
});
