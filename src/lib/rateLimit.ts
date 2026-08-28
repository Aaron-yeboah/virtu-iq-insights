/**
 * Lightweight client-side rate limiter.
 * Tracks submission timestamps per key in localStorage.
 * Use for UX-level protection (not a replacement for server guards).
 */

export interface RateLimitResult {
  allowed: boolean;
  /** How many attempts remain in this window */
  remaining: number;
  /** Seconds until the oldest entry expires and frees a slot */
  retryAfterSeconds: number;
}

/**
 * Check if an action is allowed under a rate limit, and record it if so.
 *
 * @param key      Unique identifier (e.g. "payment-submit:user123")
 * @param maxCalls Max allowed calls in the window
 * @param windowMs Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxCalls: number,
  windowMs: number,
): RateLimitResult {
  const storageKey = `rl:${key}`;
  const now = Date.now();

  let timestamps: number[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    timestamps = raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    timestamps = [];
  }

  // Drop timestamps outside the current window
  const windowStart = now - windowMs;
  timestamps = timestamps.filter((t) => t > windowStart);

  const remaining = Math.max(0, maxCalls - timestamps.length);

  if (timestamps.length >= maxCalls) {
    const oldest = Math.min(...timestamps);
    const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  try {
    localStorage.setItem(storageKey, JSON.stringify(timestamps));
  } catch {
    // localStorage full or unavailable
  }

  return { allowed: true, remaining: remaining - 1, retryAfterSeconds: 0 };
}

// --- Preconfigured limiters --------------------------------------------------

/** Max 7 payment submissions per hour per user */
export function checkPaymentRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`payment-submit:${userId}`, 7, 60 * 60 * 1000);
}

/** Max 5 login attempts per 5 minutes per browser */
export function checkLoginRateLimit(): RateLimitResult {
  return checkRateLimit("login-attempt", 5, 5 * 60 * 1000);
}

/** Max 3 registration attempts per 15 minutes per browser */
export function checkRegisterRateLimit(): RateLimitResult {
  return checkRateLimit("register-attempt", 3, 15 * 60 * 1000);
}

/** Max 1 analysis per 8 seconds per user */
export function checkAnalysisRateLimit(userId: string): RateLimitResult {
  return checkRateLimit(`analysis-submit:${userId}`, 1, 8 * 1000);
}

/** Human-readable countdown string e.g. "4m 32s" */
export function formatRetryAfter(seconds: number): string {
  if (seconds <= 0) return "now";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}
