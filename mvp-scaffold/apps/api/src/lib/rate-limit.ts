type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;
const buckets = new Map<string, RateLimitBucket>();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return parsed;
}

function getRateLimitWindowMs(): number {
  return parsePositiveInt(process.env.LEADS_RATE_LIMIT_WINDOW_MS, DEFAULT_WINDOW_MS);
}

function getRateLimitMaxRequests(): number {
  return parsePositiveInt(process.env.LEADS_RATE_LIMIT_MAX, DEFAULT_MAX_REQUESTS);
}

function computeRetryAfterSeconds(nowMs: number, resetAtMs: number): number {
  const deltaMs = Math.max(0, resetAtMs - nowMs);
  return Math.max(1, Math.ceil(deltaMs / 1000));
}

export function extractClientAddress(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const first = xForwardedFor.split(',')[0]?.trim();
    if (first) return first.toLowerCase();
  }

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp?.trim()) return cfConnectingIp.trim().toLowerCase();

  return 'anonymous';
}

export function consumeLeadSubmitRateLimit(clientAddress: string, nowMs: number = Date.now()): RateLimitDecision {
  const windowMs = getRateLimitWindowMs();
  const maxRequests = getRateLimitMaxRequests();
  const key = clientAddress.trim().toLowerCase() || 'anonymous';

  const current = buckets.get(key);
  if (!current || nowMs >= current.resetAt) {
    buckets.set(key, {
      count: 1,
      resetAt: nowMs + windowMs
    });
    return {
      allowed: true,
      retryAfterSeconds: computeRetryAfterSeconds(nowMs, nowMs + windowMs)
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: computeRetryAfterSeconds(nowMs, current.resetAt)
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    allowed: true,
    retryAfterSeconds: computeRetryAfterSeconds(nowMs, current.resetAt)
  };
}

export function resetRateLimitStateForTests(): void {
  buckets.clear();
}
