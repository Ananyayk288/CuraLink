import { DomainError } from "@/core/domain/errors/domain-error";

export class RateLimitExceededError extends DomainError {
  constructor(
    message: string = "Rate limit exceeded: too many patient searches. Please wait a moment before searching again."
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
  }
}

interface RateLimitRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();

  constructor(
    private readonly windowMs: number = 60 * 1000, // 1 minute
    private readonly maxRequests: number = 20 // max 20 lookups per window per key
  ) {}

  check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = this.records.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Clean old timestamps outside the window
    record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, this.windowMs - (now - oldest));
      return { allowed: false, remaining: 0, resetMs };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
    };
  }

  enforce(key: string): void {
    const { allowed } = this.check(key);
    if (!allowed) {
      throw new RateLimitExceededError();
    }
  }

  reset(key?: string): void {
    if (key) {
      this.records.delete(key);
    } else {
      this.records.clear();
    }
  }
}

// Global singleton rate limiter for patient lookups (20 searches per minute)
export const patientLookupRateLimiter = new InMemoryRateLimiter(60 * 1000, 20);
