/**
 * Retry wrapper for idempotent READS only — never wrap mutations. A blind
 * retry of an insert/update after an ambiguous failure can duplicate rows.
 *
 * Retries only network-class failures (offline, timeout, aborted). Anything
 * that reached the server and came back as an error (4xx, RLS, auth) is
 * rethrown immediately — retrying those just delays the real error.
 */
export function isRetryableError(e: unknown): boolean {
  if (e instanceof DOMException && (e.name === 'AbortError' || e.name === 'TimeoutError')) {
    return true;
  }
  const message =
    e instanceof Error ? e.message : typeof e === 'string' ? e : '';
  if (!message) return false;
  return (
    message.includes('Failed to fetch') || // Chromium network failure
    message.includes('Load failed') || // Safari/WebKit network failure (the iPad string)
    message.includes('NetworkError') || // Firefox
    message.toLowerCase().includes('timed out')
  );
}

interface RetryOptions {
  retries?: number;
  baseDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => PromiseLike<T>,
  { retries = 2, baseDelayMs = 800 }: RetryOptions = {},
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= retries || !isRetryableError(e)) throw e;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
      attempt += 1;
    }
  }
}
