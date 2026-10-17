import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Reject unknown fields and coerce query/body types via the DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3002')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins });

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Spendly API')
      .setDescription('Expense tracking: auth, categories, expenses and monthly summaries.')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api', app, doc, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  Logger.log(`API on http://localhost:${port}  |  Swagger on /api`, 'Bootstrap');
}

bootstrap();
