export interface RateLimitConfig {
  authMaxAttempts: number;
  authBaseBackoffMs: number;
  actionMaxPerMinute: number;
  publicMaxPerMinute: number;
}

export const defaultConfig: RateLimitConfig = {
  authMaxAttempts: 5,
  authBaseBackoffMs: 2000, // 2 seconds initial backoff
  actionMaxPerMinute: 60,
  publicMaxPerMinute: 30,
};

interface AttemptRecord {
  count: number;
  lastAttemptTime: number;
  blockedUntil: number;
}

class RateLimiter {
  private attemptsMap = new Map<string, AttemptRecord>();
  private actionTimestamps = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = defaultConfig) {
    this.config = config;
  }

  public updateConfig(newConfig: Partial<RateLimitConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Enforces auth rate limits (Login, Signup, Password Reset) with Exponential Backoff.
   */
  public checkAuthLimit(identifier: string): { allowed: boolean; retryAfterMs: number; remainingAttempts: number } {
    const now = Date.now();
    const key = `auth:${identifier.toLowerCase().trim()}`;
    const record = this.attemptsMap.get(key) || { count: 0, lastAttemptTime: now, blockedUntil: 0 };

    if (now < record.blockedUntil) {
      return {
        allowed: false,
        retryAfterMs: record.blockedUntil - now,
        remainingAttempts: 0,
      };
    }

    // Reset attempts if no attempt in past 15 minutes
    if (now - record.lastAttemptTime > 15 * 60 * 1000) {
      record.count = 0;
    }

    return {
      allowed: true,
      retryAfterMs: 0,
      remainingAttempts: Math.max(0, this.config.authMaxAttempts - record.count),
    };
  }

  public recordAuthAttempt(identifier: string, success: boolean) {
    const now = Date.now();
    const key = `auth:${identifier.toLowerCase().trim()}`;
    const record = this.attemptsMap.get(key) || { count: 0, lastAttemptTime: now, blockedUntil: 0 };

    if (success) {
      this.attemptsMap.delete(key);
      return;
    }

    record.count += 1;
    record.lastAttemptTime = now;

    if (record.count >= this.config.authMaxAttempts) {
      // Exponential Backoff calculation: baseMs * 2^(attempts - maxAttempts)
      const exponent = record.count - this.config.authMaxAttempts;
      const backoffMs = this.config.authBaseBackoffMs * Math.pow(2, exponent);
      record.blockedUntil = now + backoffMs;
    }

    this.attemptsMap.set(key, record);
  }

  /**
   * Enforces action limits per minute for authenticated user actions.
   */
  public checkActionLimit(userId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const key = `action:${userId}`;
    const oneMinuteAgo = now - 60 * 1000;

    let timestamps = (this.actionTimestamps.get(key) || []).filter((t) => t > oneMinuteAgo);

    if (timestamps.length >= this.config.actionMaxPerMinute) {
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    this.actionTimestamps.set(key, timestamps);

    return {
      allowed: true,
      remaining: this.config.actionMaxPerMinute - timestamps.length,
    };
  }
}

export const rateLimiter = new RateLimiter();
