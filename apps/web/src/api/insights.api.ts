import { apiFetch, buildQuery } from './client';
import type { Insight, InsightType } from '@/types/insight.types';

interface InsightListParams {
  limit?: number;
  type?: InsightType;
}

export const fetchInsights = (params: InsightListParams = {}): Promise<Insight[]> =>
  apiFetch<Insight[]>(`/insights${buildQuery({ limit: params.limit, type: params.type })}`);
