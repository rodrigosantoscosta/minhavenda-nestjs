import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from '@presentation/filters/global-exception.filter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AuthModule } from './auth.module';
import { CategoriaModule } from './categoria.module';
import { ProdutoModule } from './produto.module';
import { EstoqueModule } from './estoque.module';
import { CarrinhoModule } from './carrinho.module';
import { PedidoModule } from './pedido.module';
import { MessagingModule } from './messaging.module';
import { RabbitMQModule } from './rabbitmq.module';
import { AdminModule } from './admin.module';
import { validateEnv } from '@infra/config/env.validation';

@Module({
  imports: [
    // ── Config ────────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    // ── Database ──────────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get<string>('NODE_ENV') === 'production';

        // Neon (Vercel) uses DATABASE_URL; classic envs use individual DB_* vars
        const databaseUrl = configService.get<string>('DATABASE_URL');

        const baseConfig = {
          type: 'postgres' as const,
          synchronize: false,
          migrationsRun: true,
          autoLoadEntities: true,
          logging: false,
          migrations: ['dist/migrations/*.js'],
          // Neon is serverless — keep the pool small to avoid exhausting
          // the pooler's 10-connection free-tier limit.
          extra: isProd
            ? {
                max: 1,
                idleTimeoutMillis: 10_000,
                connectionTimeoutMillis: 5_000,
              }
            : {},
        };

        if (databaseUrl) {
          // Neon / any DATABASE_URL-style connection (Vercel, Supabase, etc.)
          return {
            ...baseConfig,
            url: databaseUrl,
            ssl: isProd ? { rejectUnauthorized: false } : false,
          };
        }

        // Fallback: classic individual DB_* environment variables (local Docker)
        return {
          ...baseConfig,
          host: configService.getOrThrow<string>('DB_HOST'),
          port: Number(configService.getOrThrow<number>('DB_PORT')),
          username: configService.getOrThrow<string>('DB_USERNAME'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_NAME'),
          ssl: isProd ? { rejectUnauthorized: false } : false,
        };
      },
    }),

    // ── Rate limiting ─────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),

    // ── Domain events (in-process) ────────────────────────────────────────────
    EventEmitterModule.forRoot({ global: true }),

    // ── Feature modules ───────────────────────────────────────────────────────
    AuthModule,
    CategoriaModule,
    ProdutoModule,
    EstoqueModule,
    CarrinhoModule,
    PedidoModule,

    // ── Admin dashboard ───────────────────────────────────────────────────────
    AdminModule,

    // ── Messaging: email, notifications, RabbitMQ bridge ─────────────────────
    MessagingModule,

    // ── RabbitMQ: producer, consumer, SSE registry ────────────────────────────
    RabbitMQModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
