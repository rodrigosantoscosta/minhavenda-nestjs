import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AppCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return (await this.cache.get<T>(key)) ?? null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // cache-manager v5+ usa milissegundos
    await this.cache.set(key, value, ttlSeconds !== undefined ? ttlSeconds * 1000 : undefined);
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key);
  }

  /**
   * Remove todas as chaves que começam com o prefixo dado.
   * Funciona com o store ioredis que expõe `store.keys()`.
   * Se o store não expuser `.keys()` (ex.: in-memory em testes sem mock),
   * a operação é silenciosa — nenhuma chave é removida e nenhum erro é lançado.
   */
  async delByPrefix(prefix: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const store = (this.cache as any).store;
    if (store?.keys) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const keys: string[] = await store.keys(`${prefix}*`);
      await Promise.all(keys.map((k) => this.cache.del(k)));
    }
  }
}
