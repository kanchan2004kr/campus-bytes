import 'reflect-metadata';
import 'dotenv/config'; // load apps/api/.env before any env access
import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule, { cors: false });

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  // Allow the configured web origin(s) (comma-separated). Never "*" for a
  // credentialed API — the Vercel domain(s) are set via WEB_ORIGIN.
  const allowedOrigins = env.webOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Bind to 0.0.0.0 so Render (and other PaaS) can route to the container.
  await app.listen(env.port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Campus Bytes API running on port ${env.port} (/api/v1)`);
}

void bootstrap();

export { Reflector };
