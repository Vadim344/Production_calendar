/**
 * Simple in-memory sliding-window rate limiter per organization.
 *
 * Default: 20 requests per minute per org.
 * Each org has its own bucket of timestamps; expired entries are pruned on check.
 */

const DEFAULT_MAX_REQUESTS = 20;
const DEFAULT_WINDOW_MS = 60_000; // 1 minute

interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the next request would be allowed (only set when denied). */
  retryAfter?: number;
}

/** Map of orgId -> array of request timestamps (epoch ms). */
const buckets = new Map<string, number[]>();

/**
 * Check whether a new request is allowed for the given org.
 * If allowed, the current timestamp is recorded.
 */
export function checkRateLimit(
  orgId: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Get or create bucket
  let timestamps = buckets.get(orgId);
  if (!timestamps) {
    timestamps = [];
    buckets.set(orgId, timestamps);
  }

  // Prune expired entries
  const pruned = timestamps.filter((t) => t > cutoff);
  buckets.set(orgId, pruned);

  if (pruned.length >= maxRequests) {
    // Denied -- calculate when the oldest entry in the window expires
    const oldestInWindow = pruned[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return {
      allowed: false,
      retryAfter: Math.ceil(retryAfterMs / 1000),
    };
  }

  // Allowed -- record this request
  pruned.push(now);
  return { allowed: true };
}

/**
 * Reset rate limit state for an org (useful in tests).
 */
export function resetRateLimit(orgId: string): void {
  buckets.delete(orgId);
}

/**
 * Clear all rate limit state.
 */
export function resetAllRateLimits(): void {
  buckets.clear();
}
