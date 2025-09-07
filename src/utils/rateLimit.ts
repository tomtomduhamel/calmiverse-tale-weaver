/**
 * Rate limiting for client-side requests
 * Prevents spam and abuse in production
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class ClientRateLimit {
  private attempts: Map<string, number[]> = new Map();

  isAllowed(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get existing attempts for this key
    let attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    attempts = attempts.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (attempts.length >= config.maxRequests) {
      this.attempts.set(key, attempts);
      return false;
    }
    
    // Add current attempt
    attempts.push(now);
    this.attempts.set(key, attempts);
    
    return true;
  }

  getRemainingRequests(key: string, config: RateLimitConfig): number {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    const attempts = (this.attempts.get(key) || [])
      .filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, config.maxRequests - attempts.length);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(timestamp => timestamp > now - maxAge);
      if (validAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, validAttempts);
      }
    }
  }
}

// Rate limit configurations for different operations
export const RATE_LIMITS = {
  STORY_CREATION: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  CHILD_CREATION: { maxRequests: 5, windowMs: 60 * 1000 },   // 5 per minute
  IMAGE_UPLOAD: { maxRequests: 20, windowMs: 60 * 1000 },   // 20 per minute
  GENERAL_API: { maxRequests: 100, windowMs: 60 * 1000 }    // 100 per minute
} as const;

export const clientRateLimit = new ClientRateLimit();

// Setup periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => clientRateLimit.cleanup(), 60 * 60 * 1000); // Every hour
}