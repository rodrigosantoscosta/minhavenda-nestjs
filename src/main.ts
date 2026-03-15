import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Security headers
  app.use(helmet());

  // CORS — explicit origins and headers; no wildcard
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Accept',
      'X-Requested-With',
    ],
    credentials: true,
    maxAge: 3600,
  });

  // Global validation — strips unknown fields, rejects invalid payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger — dev only, gated by SWAGGER_ENABLED=true
  if (process.env.SWAGGER_ENABLED === 'true') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('MinhaVenda API')
      .setDescription('E-commerce REST API — NestJS port of minhavenda-spring')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      useGlobalPrefix: false,
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch(console.error);
