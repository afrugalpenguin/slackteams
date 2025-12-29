import { logger } from './logger';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

interface ApiError extends Error {
  statusCode?: number;
  retryAfter?: number;
  isRetryable: boolean;
}

function createApiError(message: string, statusCode?: number, retryAfter?: number): ApiError {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.retryAfter = retryAfter;
  error.isRetryable = isRetryableError(statusCode);
  return error;
}

function isRetryableError(statusCode?: number): boolean {
  if (!statusCode) return true; // Network errors are retryable
  // Retry on rate limits, server errors, and some client errors
  return statusCode === 429 || statusCode >= 500 || statusCode === 408;
}

function getRetryDelay(attempt: number, config: RetryConfig, retryAfter?: number): number {
  // If server specified retry-after, use that
  if (retryAfter) {
    return Math.min(retryAfter * 1000, config.maxDelay);
  }
  // Otherwise use exponential backoff with jitter
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, config.maxDelay);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const apiError = parseError(error);
      lastError = apiError;

      logger.warn(
        `${operationName} failed (attempt ${attempt + 1}/${finalConfig.maxRetries + 1}):`,
        apiError.message
      );

      // Don't retry if error is not retryable or we've exhausted retries
      if (!apiError.isRetryable || attempt === finalConfig.maxRetries) {
        break;
      }

      // Wait before retrying
      const delay = getRetryDelay(attempt, finalConfig, apiError.retryAfter);
      logger.debug(`Retrying ${operationName} in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError || new Error(`${operationName} failed after ${finalConfig.maxRetries + 1} attempts`);
}

function parseError(error: unknown): ApiError {
  if (error instanceof Error) {
    // Check for Graph API error structure
    const graphError = error as { statusCode?: number; code?: string; body?: string };

    const statusCode = graphError.statusCode;
    let retryAfter: number | undefined;
    let message = error.message;

    // Try to parse body for more details
    if (graphError.body) {
      try {
        const body = JSON.parse(graphError.body);
        if (body.error?.message) {
          message = body.error.message;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Check for rate limiting
    if (statusCode === 429 || message.includes('throttl') || message.includes('rate limit')) {
      // Default to 30 seconds if no retry-after header
      retryAfter = 30;
    }

    return createApiError(message, statusCode, retryAfter);
  }

  return createApiError(String(error));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Rate limiter for preventing too many requests
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private readonly maxConcurrent: number;
  private readonly minInterval: number;
  private lastRequest = 0;

  constructor(maxConcurrent = 5, minInterval = 100) {
    this.maxConcurrent = maxConcurrent;
    this.minInterval = minInterval;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.process();
    });
  }

  release(): void {
    this.running--;
    this.process();
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const now = Date.now();
    const elapsed = now - this.lastRequest;

    if (elapsed < this.minInterval) {
      await sleep(this.minInterval - elapsed);
    }

    this.running++;
    this.lastRequest = Date.now();
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }
}

// Global rate limiter for Graph API calls
export const graphRateLimiter = new RateLimiter(5, 100);

export async function withRateLimit<T>(operation: () => Promise<T>): Promise<T> {
  await graphRateLimiter.acquire();
  try {
    return await operation();
  } finally {
    graphRateLimiter.release();
  }
}

// Combined helper for rate-limited operations with retry
export async function safeApiCall<T>(
  operation: () => Promise<T>,
  operationName: string,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return withRateLimit(() => withRetry(operation, operationName, retryConfig));
}
