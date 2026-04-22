import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Lazily instantiate so the module doesn't crash when env vars are absent
// (e.g. during `prisma generate` or other non-server steps).
let redis: Redis | null = null;

function getRedis() {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return null;
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

// 10 requests per 60 seconds per identifier
const authLimiter = new Ratelimit({
  redis: {
    sadd: async () => 0,
    eval: async () => 0,
  } as unknown as Redis, // placeholder; replaced at call-time
  limiter: Ratelimit.slidingWindow(10, "60s"),
  prefix: "rl:auth",
});

export type RateLimitResult = { success: boolean; remaining: number; reset: number };

export async function checkAuthRateLimit(identifier: string): Promise<RateLimitResult> {
  const r = getRedis();

  // If Redis isn't configured (local dev without Upstash), allow all requests
  if (!r) {
    return { success: true, remaining: 10, reset: 0 };
  }

  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(10, "60s"),
    prefix: "rl:auth",
  });

  const result = await limiter.limit(identifier);
  return { success: result.success, remaining: result.remaining, reset: result.reset };
}
