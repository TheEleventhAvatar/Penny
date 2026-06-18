import type { PravaRetryOptions } from './types';

const DEFAULTS: Required<PravaRetryOptions> = {
  retries: 2,
  delayMs: 350,
  backoffFactor: 2,
};

export async function withRetry<T>(operation: () => Promise<T>, options: PravaRetryOptions = {}): Promise<T> {
  const config = { ...DEFAULTS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.retries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === config.retries) {
        break;
      }

      const waitTime = config.delayMs * config.backoffFactor ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Prava request failed after retries');
}
