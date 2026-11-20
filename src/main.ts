import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { toNestLogLevels } from './config/env.validation';
import { AppModule } from './app.module';
import { buildSwaggerConfig } from './swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: toNestLogLevels(process.env.LOG_LEVEL ?? 'log'),
  });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter(config));
  app.enableShutdownHooks();

  if (config.get<string>('SWAGGER_ENABLED') === 'true') {
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig());
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = config.get<number>('PORT') ?? 3000;
  const host = config.get<string>('HOST') ?? '0.0.0.0';
  await app.listen(port, host);

  logger.log(`API lista en http://${host}:${port}`);
}
void bootstrap();
