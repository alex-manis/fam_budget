import OpenAI from 'openai';
import { env } from '../../config/env.js';

/**
 * Lazy singleton — only instantiated when first accessed.
 * Prevents startup failure when OPENAI_API_KEY is not set;
 * callers must check env.OPENAI_API_KEY before using the client.
 */
let _client: OpenAI | null = null;

export const getOpenAIClient = (): OpenAI => {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  _client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _client;
};

export const isOpenAIConfigured = (): boolean => Boolean(env.OPENAI_API_KEY);
