import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  // CORS configuration from environment
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
  logger.log(`API available at http://localhost:${port}/api`);
}
bootstrap();
