import { registerAs } from '@nestjs/config';

export const cacheConfig = registerAs('cache', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  ttl: Number(process.env.REDIS_TTL_SECONDS ?? 300),
}));
