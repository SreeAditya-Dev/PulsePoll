import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../config/redis';

/*
  Redis-backed rate limiter.
  - Per-IP global limit: max 30 requests per minute across all endpoints
  - Per-IP per-poll vote limit: 1 vote per poll (stored for 1 hour)
*/

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export function createRateLimiter(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const redis = await getRedisClient();
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${config.keyPrefix}:${clientIp}`;

      const currentCount = await redis.incr(key);

      // set expiry on first hit
      if (currentCount === 1) {
        await redis.pExpire(key, config.windowMs);
      }

      if (currentCount > config.maxRequests) {
        const ttl = await redis.pTTL(key);
        res.set('Retry-After', String(Math.ceil((ttl > 0 ? ttl : config.windowMs) / 1000)));
        res.status(429).json({
          error: 'Too many requests',
          message: 'Please slow down and try again later.',
          retryAfterMs: ttl > 0 ? ttl : config.windowMs,
        });
        return;
      }

      next();
    } catch (err) {
      // if redis is down, let the request through (fail-open)
      console.error('Rate limiter error:', err);
      next();
    }
  };
}

/*
  Check if an IP already voted on a specific poll.
  Sets a redis flag for 24 hours (86400 seconds).
*/
export async function markIpVoted(ip: string, pollId: string): Promise<void> {
  try {
    const redis = await getRedisClient();
    const key = `vote_lock:${ip}:${pollId}`;
    await redis.set(key, '1', { EX: 86400 }); // 24 hours
  } catch (err) {
    console.error('Failed to mark IP vote in Redis:', err);
  }
}

export async function hasIpVoted(ip: string, pollId: string): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const key = `vote_lock:${ip}:${pollId}`;
    const result = await redis.get(key);
    return result !== null;
  } catch (err) {
    console.error('Failed to check IP vote in Redis:', err);
    return false; // fail-open
  }
}
