import 'reflect-metadata';
import { DataSource } from 'typeorm';

/**
 * Production DataSource — used by the TypeORM CLI for migrations.
 *
 * Supports both:
 *   - DATABASE_URL (Neon / Vercel / Supabase)
 *   - Individual DB_* vars (Render, Railway, Docker)
 *
 * Invoke after `nest build`:
 *   node ./node_modules/typeorm/cli.js migration:run -d dist/infrastructure/persistence/typeorm-data-source.prod.js
 */
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  logging: false,
  entities: ['dist/domain/entities/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});

export default dataSource;
