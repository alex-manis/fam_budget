const BASE_URL = '/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiEnvelope<T> {
  data: T;
  meta?: unknown;
}

interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export const apiFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? `HTTP ${res.status}`,
      res.status,
      body?.error?.details,
    );
  }

  const body = (await res.json()) as ApiEnvelope<T> & { meta?: unknown };
  return body.data;
};

export const buildQuery = (params: Record<string, string | number | undefined>): string => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};
