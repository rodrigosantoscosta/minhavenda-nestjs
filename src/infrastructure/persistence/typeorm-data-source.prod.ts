import 'reflect-metadata';
import { DataSource } from 'typeorm';

/**
 * Production DataSource — used by the TypeORM CLI during deployment (render.yaml).
 * Points to compiled JS files in dist/ so no ts-node is needed at runtime.
 * The CLI is invoked AFTER `nest build`, so dist/ is always populated.
 */
const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,       // Render injects this automatically
  ssl: { rejectUnauthorized: false },  // required for Render managed Postgres
  synchronize: false,
  logging: false,
  entities: ['dist/domain/entities/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});

export default dataSource;
