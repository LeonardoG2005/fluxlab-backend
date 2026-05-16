import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';

function parseCorsOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();

  app.use(
    helmet({
      contentSecurityPolicy: false, // evita problemas con Swagger en dev
    }),
  );

  const corsOrigins = parseCorsOrigins(
    process.env.CORS_ORIGINS ?? process.env.CORS_ORIGIN,
  );
  const corsCredentials = process.env.CORS_CREDENTIALS === 'true';

  if (corsOrigins.length > 0) {
    app.enableCors({
      origin: corsOrigins,
      credentials: corsCredentials,
    });
  } else if (nodeEnv !== 'production') {
    app.enableCors({
      origin: '*',
      credentials: false,
    });
  } else {
    logger.warn(
      'CORS deshabilitado (NODE_ENV=production) porque CORS_ORIGINS/CORS_ORIGIN no está definido.',
    );
    app.enableCors({
      origin: false,
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, //se agregó esto para cuando se use la librería transformer en los DTO
    }),
  );

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  const swaggerEnabled = process.env.SWAGGER_ENABLED
    ? process.env.SWAGGER_ENABLED === 'true'
    : nodeEnv !== 'production';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Fluxlab API')
      .setDescription('Fluxlab API description')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, documentFactory, {
      jsonDocumentUrl: 'api/swagger/json',
    });
  }

  const portRaw = process.env.PORT ?? '3000';
  const port = Number.parseInt(portRaw, 10);
  const listenPort = Number.isFinite(port) ? port : 3000;
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(listenPort, host);
  logger.log(`API escuchando en http://${host}:${listenPort}/api`);
}
void bootstrap();
