import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, withRateLimit } from './api';

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const operation = vi.fn().mockResolvedValue('success');

    const result = await withRetry(operation, 'testOperation');

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and succeed', async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const promise = withRetry(operation, 'testOperation');

    // Fast-forward through retry delay
    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries exceeded', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));

    // Start the operation and catch to prevent unhandled rejection
    let caughtError: Error | undefined;
    const promise = withRetry(operation, 'testOperation', { maxRetries: 2 })
      .catch((e: Error) => { caughtError = e; });

    // Fast-forward through all retry delays
    await vi.runAllTimersAsync();
    await promise;

    expect(caughtError?.message).toBe('Persistent error');
    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should not retry on non-retryable errors (4xx)', async () => {
    const error = new Error('Not found') as Error & { statusCode: number };
    error.statusCode = 404;
    const operation = vi.fn().mockRejectedValue(error);

    const promise = withRetry(operation, 'testOperation');

    await expect(promise).rejects.toThrow('Not found');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit (429)', async () => {
    const error = new Error('Rate limited') as Error & { statusCode: number };
    error.statusCode = 429;

    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const promise = withRetry(operation, 'testOperation');

    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should retry on server errors (5xx)', async () => {
    const error = new Error('Server error') as Error & { statusCode: number };
    error.statusCode = 500;

    const operation = vi.fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce('success');

    const promise = withRetry(operation, 'testOperation');

    await vi.runAllTimersAsync();

    const result = await promise;
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });
});

describe('withRateLimit', () => {
  it('should execute operation immediately when under limit', async () => {
    const operation = vi.fn().mockResolvedValue('result');

    const result = await withRateLimit(operation);

    expect(result).toBe('result');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should pass through errors', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('Operation failed'));

    await expect(withRateLimit(operation)).rejects.toThrow('Operation failed');
  });
});
