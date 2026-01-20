/**
 * Retry fetch utility with exponential backoff
 *
 * Handles transient failures like network errors, 401 auth errors,
 * and server errors with automatic retry logic.
 *
 * Use cases:
 * - Auth token expiration during request (auto-retry after refresh)
 * - Temporary network issues
 * - Server 5xx errors (transient failures)
 *
 * @module retry-fetch
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 2)
   * Total attempts = 1 initial + maxRetries
   */
  maxRetries?: number;

  /**
   * Base delay between retries in milliseconds (default: 1000)
   * Actual delay uses exponential backoff: baseDelay * (2 ^ attemptNumber)
   */
  retryDelay?: number;

  /**
   * Custom function to determine if error should trigger retry
   * Default: Retries on 401 (auth), 408 (timeout), 429 (rate limit), 5xx (server errors)
   */
  shouldRetry?: (response: Response | null, error: Error | null, attempt: number) => boolean;

  /**
   * Callback fired before each retry attempt
   * Useful for logging or showing retry UI feedback
   */
  onRetry?: (attempt: number, error: Error | null, response: Response | null) => void;
}

/**
 * Default retry strategy
 * Retries on:
 * - 401 Unauthorized (token may have expired, will be refreshed)
 * - 408 Request Timeout
 * - 429 Too Many Requests (rate limiting)
 * - 5xx Server Errors (transient failures)
 * - Network errors (fetch throws)
 */
const defaultShouldRetry = (
  response: Response | null,
  error: Error | null,
  attempt: number
): boolean => {
  // Don't retry on last attempt
  if (attempt >= 2) return false;

  // Retry on network errors
  if (error && !response) return true;

  // Retry on specific HTTP status codes
  if (response) {
    const status = response.status;
    return status === 401 || status === 408 || status === 429 || status >= 500;
  }

  return false;
};

/**
 * Calculate exponential backoff delay
 * Formula: baseDelay * (2 ^ attempt) + random jitter
 *
 * Example with baseDelay=1000:
 * - Attempt 0: 1000ms + jitter
 * - Attempt 1: 2000ms + jitter
 * - Attempt 2: 4000ms + jitter
 */
const calculateBackoff = (baseDelay: number, attempt: number): number => {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add random jitter (0-20%) to prevent thundering herd
  const jitter = Math.random() * 0.2 * exponentialDelay;
  return exponentialDelay + jitter;
};

/**
 * Fetch with automatic retry on transient failures
 *
 * @param url - Request URL
 * @param options - Fetch options + retry configuration
 * @returns Promise<Response>
 * @throws Error after all retries exhausted
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (2 retries, 1s delay)
 * const response = await fetchWithRetry('/api/products', {
 *   method: 'GET',
 *   headers: { Authorization: 'Bearer token' },
 * });
 *
 * // Custom retry config
 * const response = await fetchWithRetry('/api/orders', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 *   maxRetries: 3,
 *   retryDelay: 2000,
 *   onRetry: (attempt) => {
 *     console.log(`Retry attempt ${attempt}...`);
 *   },
 * });
 *
 * // Custom retry condition
 * const response = await fetchWithRetry('/api/critical', {
 *   shouldRetry: (res, err, attempt) => {
 *     // Only retry on 503 Service Unavailable
 *     return res?.status === 503 && attempt < 5;
 *   },
 * });
 * ```
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 2,
    retryDelay = 1000,
    shouldRetry = defaultShouldRetry,
    onRetry,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  // Total attempts = 1 initial + maxRetries
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);

      // Clone response for retry logic (body can only be read once)
      lastResponse = response.clone();

      // Check if we should retry based on status code
      if (shouldRetry(lastResponse, null, attempt)) {
        if (attempt < maxRetries) {
          // Call retry callback if provided
          if (onRetry) {
            onRetry(attempt + 1, null, lastResponse);
          }

          // Wait before retry with exponential backoff
          const delay = calculateBackoff(retryDelay, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Continue to next attempt
          continue;
        }
      }

      // Success or non-retryable error - return response
      return response;
    } catch (error) {
      lastError = error as Error;
      lastResponse = null;

      // Check if we should retry
      if (shouldRetry(null, lastError, attempt)) {
        if (attempt < maxRetries) {
          // Call retry callback if provided
          if (onRetry) {
            onRetry(attempt + 1, lastError, null);
          }

          // Wait before retry with exponential backoff
          const delay = calculateBackoff(retryDelay, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));

          // Continue to next attempt
          continue;
        }
      }

      // Non-retryable error or max retries reached - throw
      throw error;
    }
  }

  // Should never reach here, but TypeScript requires it
  if (lastError) {
    throw lastError;
  }

  if (lastResponse) {
    return lastResponse;
  }

  throw new Error('Fetch failed after retries with unknown error');
}

/**
 * Preset: Fetch with auth retry only
 *
 * Retries only on 401 Unauthorized (useful after token refresh)
 * Faster than default strategy (1 retry, 500ms delay)
 */
export async function fetchWithAuthRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    maxRetries: 1,
    retryDelay: 500,
    shouldRetry: (response) => response?.status === 401,
  });
}

/**
 * Preset: Fetch with aggressive retry
 *
 * More retries for critical operations (5 retries, 2s base delay)
 * Use for important operations like checkout, payment, order creation
 */
export async function fetchWithAggressiveRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetchWithRetry(url, {
    ...options,
    maxRetries: 5,
    retryDelay: 2000,
  });
}

/**
 * Preset: Fetch without retry
 *
 * No retries, just standard fetch
 * Use for operations where retry would be harmful (e.g., idempotency issues)
 */
export async function fetchWithoutRetry(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, options);
}
