import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';

let cachedApp: express.Express | null = null;

/**
 * AppFactory — isolates Express/Nest bootstrap for Vercel serverless.
 *
 * Uses a module-level cache so the NestJS application is only initialised
 * once per cold start (Lambda/Serverless Function container lifetime).
 */
export class AppFactory {
  static getExpressApp(): express.Express {
    if (!cachedApp) {
      const expressApp = express();
      const adapter = new ExpressAdapter(expressApp);

      // Bootstrap is async, but Vercel awaits the handler promise.
      // We return the express instance and Nest attaches itself to it.
      void NestFactory.create(AppModule, adapter, { logger: ['error', 'warn'] }).then(
        async (nestApp) => {
          nestApp.setGlobalPrefix('api');

          nestApp.use(helmet());

          const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean);

          nestApp.enableCors({
            origin: allowedOrigins.length > 0 ? allowedOrigins : false,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Requested-With'],
            credentials: true,
            maxAge: 3600,
          });

          nestApp.useGlobalPipes(
            new ValidationPipe({
              whitelist: true,
              forbidNonWhitelisted: true,
              transform: true,
            }),
          );

          await nestApp.init();
        },
      );

      cachedApp = expressApp;
    }

    return cachedApp;
  }
}
