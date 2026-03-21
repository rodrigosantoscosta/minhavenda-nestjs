import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppCacheService } from './cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
        }),
        ttl: configService.get<number>('REDIS_TTL_SECONDS', 300) * 1000,
      }),
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService],
})
export class AppCacheModule {}
